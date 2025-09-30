import type {MarkerId, MarkerOptions} from '$lib/interfaces/marker';
import {Marker} from './marker';
import {MarkerRepository} from './markerRepository';
import {DeckOverlayRenderer} from './renderer/deckOverlayRenderer';
import {DomMarkerRenderer} from './renderer/domMarkerRenderer';
import type {MarkerRenderer} from './renderer/markerRenderer';
import {UpdateScheduler} from './updateScheduler';
import {ViewportIndex} from './viewportIndex';
import {VisibilityEngine} from './visibilityEngine';

export interface MarkerManagerOptions {
    chunkSize: number; // Number of markers to process per animation frame
    maxVisibleMarkers: number; // Maximum markers to display on screen at once
    maxZoom: number; // Maximum zoom level to display markers
    renderer?: 'dom' | 'deck';
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
        private map: google.maps.Map,
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
        this.renderer = this.isDeck ? new DeckOverlayRenderer(this.map) : new DomMarkerRenderer();
        this.visibilityEngine = new VisibilityEngine(
            this.repo,
            {chunkSize: this.options.chunkSize},
            this.renderer,
        );
    }

    public async initialize(mapLoader: any) {
        try {
            await mapLoader.importLibrary('marker');
        } catch (error) {
            console.error('Failed to pre-load marker library:', error);
        }
    }

    public addMarker(id: MarkerId, position: google.maps.LatLngLiteral,options: MarkerOptions): Marker | null {
        const isLazy = options.source === 'list';

        const upsert = this.repo.upsertWithPolicy(
            id,
            () => new Marker(this.map, position, options),
            options.source,
        );

        if (upsert.action === 'ignored') {
            return upsert.marker;
        }

        if (this.isDeck) {
            this.renderer.ensureCreated(upsert.marker);
        }

        if (isLazy) {
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

        if (marker.getSource() === 'map' || marker.getSource() === 'search') {
            this.scheduleViewportUpdate();
        }

        return marker;
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

    public setRendererMode(renderer: 'dom' | 'deck') {
        const wasDeck = this.isDeck;
        this.isDeck = renderer === 'deck';

        if (wasDeck === this.isDeck) {
            return;
        }

        this.disableMarkers();

        this.renderer.destroy();
        this.renderer = this.isDeck ? new DeckOverlayRenderer(this.map) : new DomMarkerRenderer();
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

    private updateMarkersInViewport() {
        if (!this.map.getBounds() || this.scheduler.isSuppressed) {
            this.scheduler.complete();
            return;
        }

        const bounds = this.map.getBounds() as google.maps.LatLngBounds;
        const candidates = this.viewportIndex.collect(bounds, this.repo);
        const center = bounds.getCenter();
        const centerPosition = {lat: center.lat(), lng: center.lng()};
        const visibleIds = this.viewportIndex.selectVisible(
            candidates,
            centerPosition,
            this.options.maxVisibleMarkers,
        );

        this.visibilityEngine.updateVisibility(visibleIds, () => this.scheduler.complete());
    }

    public destroy() {
        this.renderer.destroy();
        this.repo.clear();
    }
}
