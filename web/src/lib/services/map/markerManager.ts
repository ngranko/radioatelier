import type { MarkerOptions } from '$lib/interfaces/marker';
import { Marker } from './marker';

export interface MarkerManagerOptions {
    chunkSize: number; // Number of markers to process per animation frame
    maxVisibleMarkers: number; // Maximum markers to display on screen at once
    maxZoom: number; // Maximum zoom level to display markers
}

export class MarkerManager {
    private map: google.maps.Map;
    private options: MarkerManagerOptions;
    private visibleMarkers = new Set<string>();
    private markerCache = new Map<string, Marker>();
private replacedMarkers = new Map<
        string,
        Marker
    >();

    private updateInProgress = false;
    private pendingViewportUpdate = false;
    private suppressUpdates = false;

    public constructor(map: google.maps.Map, options: Partial<MarkerManagerOptions> = {}) {
        this.map = map;
        this.options = {
            chunkSize: 50,
            maxVisibleMarkers: 1000,
            maxZoom: 10,
            ...options,
        };
    }
    
    public async initialize(mapLoader: any) {
        try {
            await mapLoader.importLibrary('marker');
        } catch (error) {
            console.error('Failed to pre-load marker library:', error);
        }
    }
    
    public addMarker(
        id: string,
        position: google.maps.LatLngLiteral,
        options: MarkerOptions,
    ): Marker | null {
        const isLazy = options.source === 'list';
        
        const existingMarker = this.markerCache.get(id);
        
        // If this is a search marker and there's an existing non-search marker,
        // we need to replace it. If it's a regular marker and there's already a search marker,
        // we should return the existing search marker.
        if (existingMarker) {
            if (options.source === 'search' && existingMarker.getSource() !== 'search') {
                // Search marker should replace existing marker
                existingMarker.hide();
                this.replacedMarkers.set(id, existingMarker);
                this.removeMarkerFromCache(id);
            } else if (options.source !== 'search' && existingMarker.getSource() === 'search') {
                return existingMarker;
            } else if (existingMarker.getSource() === options.source) {
                return existingMarker;
            }
        }
        
        const bareMarker = new Marker(this.map, position, options);
        this.markerCache.set(id, bareMarker);
        
        if (isLazy) {
            this.scheduleViewportUpdate();
            return bareMarker;
        }
        
        return this.createMarker(id);
    }
    
    private createMarker(id: string): Marker {
        const marker = this.markerCache.get(id);
        if (!marker) {
            throw new Error('Marker not found');
        }
        
        marker.create();
        
        if (marker.getSource() === 'map' || marker.getSource() === 'search') {
            this.scheduleViewportUpdate();
        }
        
        return marker;
    }

    public scheduleViewportUpdate() {
        if (this.pendingViewportUpdate || this.suppressUpdates) {
            return;
        }
        this.pendingViewportUpdate = true;
        setTimeout(() => {
            this.pendingViewportUpdate = false;
            this.triggerViewportUpdate();
        }, 0);
    }
    
    public disableMarkers() {
        this.suppressUpdates = true;

        for (const id of Array.from(this.visibleMarkers)) {
            const marker = this.markerCache.get(id);
            if (marker) {
                marker.hide();
            }
        }
    }

    public enableMarkers() {
        this.suppressUpdates = false;
    }

    public updateMarkerVisibility(id: string, isVisible: boolean) {
        if (isVisible && !this.visibleMarkers.has(id)) {
            this.showMarker(id);
        } else if (!isVisible && this.visibleMarkers.has(id)) {
            this.hideMarker(id);
        }
    }

    public showMarker(id: string) {
        const marker = this.markerCache.get(id);
        if (!marker) {
            throw new Error('Marker not found');
        }

        if (marker.isCreated()) {
            marker.show();
            this.visibleMarkers.add(id);
        } else {
            const newMarker = this.createMarker(id);
            newMarker.show();
            this.visibleMarkers.add(id);
        }
    }
    public hideMarker(id: string) {
        this.visibleMarkers.delete(id);

        const marker = this.markerCache.get(id);
        if (!marker) {
            return;
        }

        marker.hide();
    }

    public removeMarker(id: string) {
        const marker = this.markerCache.get(id);
        if (!marker) {
            return;
        }

        marker.remove(() => {
            this.removeMarkerFromCache(id);
            this.maybeRestoreReplacedMarker(id);
        });
    }

    private maybeRestoreReplacedMarker(id: string) {
        const replacedMarker = this.replacedMarkers.get(id);
        if (!replacedMarker) {
            return;
        }

        this.markerCache.set(id, replacedMarker);
        this.replacedMarkers.delete(id);

        this.scheduleViewportUpdate();
    }

    private removeMarkerFromCache(id: string) {
        this.markerCache.delete(id);
        this.visibleMarkers.delete(id);
    }

    private collectMarkersInViewport(
        bounds: google.maps.LatLngBounds,
    ): Array<{id: string; position: google.maps.LatLngLiteral}> {
        const allMarkersInViewport: Array<{id: string; position: google.maps.LatLngLiteral}> = [];

        for (const [id, markerData] of this.markerCache.entries()) {
            if (bounds.contains(markerData.getPosition())) {
                allMarkersInViewport.push({id, position: markerData.getPosition()});
            }
        }

        return allMarkersInViewport;
    }

    private sortMarkersByDistance(
        markers: Array<{id: string; position: google.maps.LatLngLiteral}>,
        center: google.maps.LatLngLiteral,
    ): Array<{id: string; position: google.maps.LatLngLiteral}> {
        const sorted = markers.sort((a, b) => {
            const distanceA = this.calculateDistance(a.position, center);
            const distanceB = this.calculateDistance(b.position, center);
            return distanceA - distanceB;
        });
        return sorted;
    }

    private pickVisibleIds(
        sortedMarkers: Array<{id: string; position: google.maps.LatLngLiteral}>,
        maxVisibleMarkers: number,
    ): Set<string> {
        const visibleIds = new Set<string>();
        for (let i = 0; i < Math.min(sortedMarkers.length, maxVisibleMarkers); i++) {
            visibleIds.add(sortedMarkers[i].id);
        }
        return visibleIds;
    }

    private updateMarkersInViewport() {
        if (!this.map || !this.map.getBounds() || this.suppressUpdates) {
            this.updateInProgress = false;
            return;
        }

        const bounds = this.map.getBounds() as google.maps.LatLngBounds;

        const allMarkersInViewport = this.collectMarkersInViewport(bounds);

        const center = bounds.getCenter();
        const centerPosition = {lat: center.lat(), lng: center.lng()};
        const sortedMarkers = this.sortMarkersByDistance(allMarkersInViewport, centerPosition);
        const visibleIds = this.pickVisibleIds(sortedMarkers, this.options.maxVisibleMarkers);

        this.processMarkerVisibilityUpdates(visibleIds);
    }

    private processMarkerVisibilityUpdates(visibleIds: Set<string>) {
        if (this.suppressUpdates) {
            this.updateInProgress = false;
            return;
        }

        const allMarkerIds = Array.from(this.markerCache.keys());
        let currentIndex = 0;

        const processChunk = () => {
            const endIndex = Math.min(currentIndex + this.options.chunkSize, allMarkerIds.length);

            for (let i = currentIndex; i < endIndex; i++) {
                if (this.suppressUpdates) {
                    this.updateInProgress = false;
                    return;
                }

                const id = allMarkerIds[i];
                this.updateMarkerVisibility(id, visibleIds.has(id));
            }

            currentIndex = endIndex;

            if (currentIndex < allMarkerIds.length) {
                requestAnimationFrame(processChunk);
            } else {
                this.updateInProgress = false;
            }
        };

        requestAnimationFrame(processChunk);
    }

    private triggerViewportUpdate() {
        if (this.suppressUpdates) {
            return;
        }

        if (!this.map || !this.map.getBounds()) {
            setTimeout(() => this.triggerViewportUpdate(), 100);
            return;
        }

        if (this.updateInProgress) {
            setTimeout(() => this.triggerViewportUpdate(), 50);
            return;
        }

        this.updateInProgress = true;
        this.updateMarkersInViewport();
    }

    // Cleanup method
    public destroy() {
        this.markerCache.clear();
        this.visibleMarkers.clear();
        this.replacedMarkers.clear();
    }

    private calculateDistance(
        pos1: google.maps.LatLngLiteral,
        pos2: google.maps.LatLngLiteral,
    ): number {
        const lat1 = (pos1.lat * Math.PI) / 180;
        const lat2 = (pos2.lat * Math.PI) / 180;
        const deltaLat = ((pos2.lat - pos1.lat) * Math.PI) / 180;
        const deltaLng = ((pos2.lng - pos1.lng) * Math.PI) / 180;

        const a =
            Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return 6371 * c; // Earth's radius in km
    }
}
