import type {LatLngLiteral, MapProvider} from '$lib/interfaces/map';
import type {MarkerId, MarkerOptions, MarkerStateUpdate} from '$lib/interfaces/marker';
import {Marker} from '$lib/services/map/marker';
import {MarkerRepository} from '$lib/services/map/markerRepository';
import type {MarkerRenderer} from '$lib/services/map/renderer/markerRenderer';
import {UpdateScheduler} from '$lib/services/map/updateScheduler';
import {ViewportIndex} from '$lib/services/map/viewportIndex';
import {VisibilityEngine} from '$lib/services/map/visibilityEngine';

export type RendererMode = 'dom' | 'deck';
export type RendererFactory = (mode: RendererMode) => MarkerRenderer;

export interface MarkerManagerOptions {
    chunkSize: number;
    maxVisibleMarkers: number;
    maxZoom: number;
    renderer?: RendererMode;
}

export class MarkerManager {
    private options: MarkerManagerOptions;
    private repo = new MarkerRepository();

    private viewportIndex = new ViewportIndex();
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
            chunkSize: 50,
            maxVisibleMarkers: 1000,
            maxZoom: 10,
            renderer: 'dom',
            ...options,
        };

        this.isDeck = this.options.renderer === 'deck';
        this.renderer = createRenderer(this.isDeck ? 'deck' : 'dom');
        this.visibilityEngine = new VisibilityEngine(
            this.repo,
            {chunkSize: this.options.chunkSize},
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

    public addMarker(id: MarkerId, position: LatLngLiteral, options: MarkerOptions): Marker | null {
        const upsert = this.repo.upsertWithPolicy(
            id,
            () => new Marker(position, options),
            options.source,
        );

        if (upsert.action === 'ignored') {
            return upsert.marker;
        }

        if (this.isDeck) {
            this.renderer.ensureCreated(upsert.marker);
        }

        if (upsert.marker.isLazy()) {
            this.scheduleViewportUpdate();
            return upsert.marker;
        }

        return this.createMarker(id);
    }

    private createMarker(id: MarkerId): Marker {
        const marker = this.repo.get(id);
        if (!marker) {
            throw new Error('Marker not found');
        }

        this.renderer.ensureCreated(marker);
        this.scheduleViewportUpdateFor(marker);

        return marker;
    }

    private scheduleViewportUpdateFor(marker: Marker) {
        if (!marker.isViewportManaged()) {
            return;
        }

        this.scheduleViewportUpdate();
    }

    public getMarker(id: MarkerId): Marker | undefined {
        return this.repo.get(id);
    }

    public scheduleViewportUpdate() {
        this.scheduler.schedule();
    }

    public disableMarkers() {
        this.scheduler.disable();
        this.visibilityEngine.setSuppressed(true);

        for (const id of this.repo.getVisibleIds()) {
            this.visibilityEngine.hide(id);
        }
    }

    public enableMarkers() {
        this.scheduler.enable();
        this.visibilityEngine.setSuppressed(false);
    }

    public setRendererMode(renderer: RendererMode): void {
        const wasDeck = this.isDeck;
        this.isDeck = renderer === 'deck';

        if (wasDeck === this.isDeck) {
            return;
        }

        this.disableMarkers();

        this.renderer.destroy();
        this.renderer = this.createRenderer(this.isDeck ? 'deck' : 'dom');
        this.visibilityEngine.setRenderer(this.renderer);

        this.renderer.syncAll(this.repo.values());

        this.enableMarkers();
        this.scheduleViewportUpdate();
    }

    public removeMarker(id: MarkerId) {
        const marker = this.repo.get(id);
        if (!marker) {
            return;
        }

        this.renderer.remove(marker, () => {
            this.repo.remove(id);
            const restored = this.repo.maybeRestoreReplaced(id);
            if (restored) {
                this.scheduleViewportUpdate();
            }
        });
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

        const candidates = this.viewportIndex.collect(bounds, this.repo);
        const center = bounds.getCenter();
        const visibleIds = this.viewportIndex.selectVisible(
            candidates,
            center,
            this.options.maxVisibleMarkers,
        );

        this.visibilityEngine.updateVisibility(visibleIds, () => this.scheduler.complete());
    }

    public destroy() {
        this.renderer.destroy();
        this.repo.clear();
    }
}
