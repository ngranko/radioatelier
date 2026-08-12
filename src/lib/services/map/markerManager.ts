import config from '$lib/config';
import type {LatLngLiteral, MapProvider} from '$lib/interfaces/map';
import type {MarkerId, MarkerOptions, MarkerStateUpdate} from '$lib/interfaces/marker';
import {Marker} from '$lib/services/map/marker';
import {MarkerRepository} from '$lib/services/map/markerRepository';
import type {MarkerRenderer, RendererMode} from '$lib/services/map/renderer/markerRenderer';
import {UpdateScheduler} from '$lib/services/map/updateScheduler';
import {selectVisibleMarkerIds} from '$lib/services/map/viewportSelection';
import {VisibilityEngine} from '$lib/services/map/visibilityEngine';

export type {RendererMode};

export type RendererFactory = (mode: RendererMode) => MarkerRenderer;

export interface MarkerManagerOptions {
    frameBudgetMs: number;
    maxVisibleMarkers: number;
    deckZoomThreshold: number;
    onMarkerShown?: (marker: Marker) => void;
}

export class MarkerManager {
    private options: MarkerManagerOptions;
    private repo = new MarkerRepository();

    private scheduler = new UpdateScheduler(() => this.updateMarkersInViewport());
    private renderer!: MarkerRenderer;
    private visibilityEngine!: VisibilityEngine;
    private isDeck = false;

    public constructor(
        private provider: MapProvider,
        private createRenderer: RendererFactory,
        options: Partial<MarkerManagerOptions> = {},
    ) {
        this.options = {
            frameBudgetMs: 8,
            maxVisibleMarkers: 1000,
            deckZoomThreshold: config.deckZoomThreshold,
            ...options,
        };

        this.isDeck = this.shouldUseDeck();
        this.renderer = createRenderer(this.isDeck ? 'deck' : 'dom');
        this.visibilityEngine = new VisibilityEngine(
            this.repo,
            {frameBudgetMs: this.options.frameBudgetMs, onShown: this.options.onMarkerShown},
            this.renderer,
        );
    }

    public get isDeckRenderer(): boolean {
        return this.isDeck;
    }

    public async initialize() {
        try {
            await this.provider.preloadMarkerLibrary();
        } catch (error: unknown) {
            console.error('Failed to pre-load marker library:', error);
            throw error;
        }
    }

    public addMarker(id: MarkerId, position: LatLngLiteral, options: MarkerOptions): Marker {
        const upsert = this.repo.upsertWithPolicy(
            id,
            () => new Marker(position, options),
            options.source,
        );

        if (upsert.action === 'ignored') {
            return upsert.marker;
        }

        const marker = upsert.marker;
        if (!marker.isViewportManaged()) {
            this.visibilityEngine.show(id);
            return marker;
        }

        // Deck scatterplots ignore show/hide, so every list pin must join the
        // layer on insert. DOM list pins wait for the visibility pass instead.
        if (this.isDeck || !marker.isLazy()) {
            this.renderer.ensureCreated(marker);
        }

        this.scheduleViewportUpdate();
        return marker;
    }

    public getMarker(id: MarkerId): Marker | undefined {
        return this.repo.get(id);
    }

    public scheduleViewportUpdate() {
        this.scheduler.schedule();
    }

    // The zoom→mode decision and the switch sequence (suppress → setMode →
    // syncAll → resume) live behind this seam; callers only report that the
    // viewport settled.
    public syncRendererWithViewport(): void {
        const nextIsDeck = this.shouldUseDeck();
        if (nextIsDeck !== this.isDeck) {
            this.isDeck = nextIsDeck;
            this.switchRenderer();
        }
        this.scheduleViewportUpdate();
    }

    private shouldUseDeck(): boolean {
        return this.provider.getZoom() <= this.options.deckZoomThreshold;
    }

    private switchRenderer(): void {
        this.disableMarkers();
        this.renderer.setMode(this.isDeck ? 'deck' : 'dom');
        this.renderer.syncAll(this.repo.values());
        this.enableMarkers();
    }

    private disableMarkers() {
        this.scheduler.disable();
        this.visibilityEngine.setSuppressed(true);
        this.visibilityEngine.cancelPending();

        // hide() removes the entry from the set being iterated; Set iteration tolerates that.
        for (const id of this.repo.visibleIds()) {
            if (this.repo.get(id)?.isViewportManaged()) {
                this.visibilityEngine.hide(id);
            }
        }
    }

    private enableMarkers() {
        this.scheduler.enable();
        this.visibilityEngine.setSuppressed(false);
    }

    public removeMarker(id: MarkerId, marker: Marker) {
        if (this.repo.get(id) === marker) {
            this.repo.remove(id);
            const restored = this.repo.maybeRestoreReplaced(id);
            if (restored) {
                this.scheduleViewportUpdate();
            }
        }

        this.renderer.remove(marker);
    }

    public updateMarkerState(id: MarkerId, update: MarkerStateUpdate) {
        const marker = this.repo.get(id);
        if (!marker) {
            return;
        }

        marker.setState(update);
        this.renderer.applyState(marker);
    }

    private updateMarkersInViewport() {
        const bounds = this.provider.getBounds();
        if (!bounds || this.scheduler.isSuppressed) {
            this.scheduler.complete();
            return;
        }

        const visibleIds = selectVisibleMarkerIds(
            bounds,
            this.repo,
            this.options.maxVisibleMarkers,
        );

        this.visibilityEngine.updateVisibility(visibleIds, () => this.scheduler.complete());
    }

    public destroy() {
        this.renderer.destroy();
        this.repo.clear();
    }
}
