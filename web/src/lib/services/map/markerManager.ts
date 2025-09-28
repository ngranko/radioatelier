import {dragTimeout} from '$lib/stores/map.ts';

export interface MarkerManagerOptions {
    chunkSize: number; // Number of markers to process per animation frame
    maxVisibleMarkers: number; // Maximum markers to display on screen at once
    maxZoom: number; // Maximum zoom level to display markers
}

export class MarkerManager {
    private map: google.maps.Map | null = null;
    private options: MarkerManagerOptions;
    private visibleMarkers = new Set<string>();
    private markerCache = new Map<string, google.maps.marker.AdvancedMarkerElement>();
    private markerSources = new Map<string, 'map' | 'list' | 'search'>();
    private markerData = new Map<
        string,
        {
            position: google.maps.LatLngLiteral;
            options: any;
            isLazy: boolean; // Whether this marker should use lazy DOM creation
        }
    >();
    private replacedMarkers = new Map<
        string,
        {
            marker: google.maps.marker.AdvancedMarkerElement;
            source: 'map' | 'list' | 'search';
            wasVisible: boolean;
        }
    >();

    private advancedMarkerElement?: typeof google.maps.marker.AdvancedMarkerElement;
    private collisionBehavior?: typeof google.maps.CollisionBehavior;

    private updateInProgress = false;
    private pendingViewportUpdate = false;
    private suppressUpdates = false;

    public constructor(options: Partial<MarkerManagerOptions> = {}) {
        this.options = {
            chunkSize: 50,
            maxVisibleMarkers: 1000,
            maxZoom: 10,
            ...options,
        };
    }
    
    public async initialize(map: google.maps.Map, mapLoader: any) {
        this.map = map;
        
        try {
            const {AdvancedMarkerElement, CollisionBehavior} =
            await mapLoader.importLibrary('marker');
            this.advancedMarkerElement = AdvancedMarkerElement;
            this.collisionBehavior = CollisionBehavior;
        } catch (error) {
            console.error('Failed to pre-load marker library:', error);
        }
    }
    
    public createMarker(
        id: string,
        position: google.maps.LatLngLiteral,
        options: {
            icon: string;
            color: string;
            isDraggable?: boolean;
            source: 'map' | 'list' | 'search';
            onClick?(): void;
            onDragStart?(): void;
            onDragEnd?(): void;
        },
    ): google.maps.marker.AdvancedMarkerElement | null {
        const isLazy = options.source === 'list';
        
        const existingMarker = this.markerCache.get(id);
        const existingSource = this.markerSources.get(id);
        
        // If this is a search marker and there's an existing non-search marker,
        // we need to replace it. If it's a regular marker and there's already a search marker,
        // we should return the existing search marker.
        if (existingMarker) {
            if (options.source === 'search' && existingSource !== 'search') {
                // Search marker should replace existing marker
                if (existingSource) {
                    existingMarker.map = null;
                    const wasVisible = this.visibleMarkers.has(id);
                    this.replacedMarkers.set(id, {
                        marker: existingMarker,
                        source: existingSource,
                        wasVisible,
                    });
                }
                this.removeMarkerFromCache(id);
            } else if (options.source !== 'search' && existingSource === 'search') {
                return existingMarker;
            } else if (existingSource === options.source) {
                return existingMarker;
            }
        }
        
        this.markerData.set(id, {
            position,
            options,
            isLazy,
        });
        
        if (isLazy) {
            this.markerSources.set(id, options.source);
            this.scheduleViewportUpdate();
            return null;
        }
        
        return this.createMarkerDOM(id, position, options);
    }
    
    private createMarkerDOM(
        id: string,
        position: google.maps.LatLngLiteral,
        options: {
            icon: string;
            color: string;
            source: 'map' | 'list' | 'search';
            isDraggable?: boolean;
            onClick?(): void;
            onDragStart?(): void;
            onDragEnd?(): void;
        },
    ): google.maps.marker.AdvancedMarkerElement {
        if (!this.advancedMarkerElement || !this.collisionBehavior) {
            throw new Error('Marker library not initialized. Call initialize() first.');
        }
        
        let contentEl: HTMLElement;
        const iconElement = document.createElement('div');
        iconElement.className =
        'w-6 h-6 translate-y-1/2 flex justify-center items-center rounded-full transition-transform transition-opacity duration-100 ease-in-out animate-popin text-sm text-white';
        iconElement.style.backgroundColor = options.color;
        const iconEl = document.createElement('i');
        for (const cls of options.icon.split(/\s+/).filter(Boolean)) {
            iconEl.classList.add(cls);
        }
        iconElement.appendChild(iconEl);
        contentEl = iconElement;
        const marker = new this.advancedMarkerElement({
            position,
            content: contentEl,
            collisionBehavior: this.collisionBehavior.REQUIRED,
            gmpClickable: true,
            zIndex: options.source === 'search' ? 1 : 0,
        });
        
        if (options.onClick) {
            marker.addListener('gmp-click', options.onClick);
        }
        
        if (options.isDraggable) {
            contentEl.addEventListener('pointerdown', () => {
                if (options.onDragStart) {
                    dragTimeout.set(
                        setTimeout(async () => {
                            options.onDragStart!();
                            (marker.content as HTMLElement).classList.add('marker-dragging');
                        }, 500),
                    );
                }
            });
            contentEl.addEventListener('pointerup', () => {
                if (options.onDragEnd) {
                    dragTimeout.remove();
                    options.onDragEnd();
                    this.markerData.set(id, {...this.markerData.get(id)!, position: marker.position as google.maps.LatLngLiteral});
                    (marker.content as HTMLElement).classList.remove('marker-dragging');
                }
            });
        }
        
        this.markerCache.set(id, marker);
        this.markerSources.set(id, options.source);
        
        if (options.source === 'map' || options.source === 'search') {
            this.visibleMarkers.add(id);
            marker.map = this.map;

            setTimeout(() => {
                contentEl.classList.remove('animate-popin');
            }, 200);
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
            this.hideMarker(id);
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

        if (marker) {
            const markerElement = marker.content as HTMLElement;
            markerElement.classList.add('animate-popin');
            marker.map = this.map;
            this.visibleMarkers.add(id);

            setTimeout(() => {
                markerElement.classList.remove('animate-popin');
            }, 200);
        } else {
            const markerData = this.markerData.get(id);
            if (markerData?.isLazy) {
                const newMarker = this.createMarkerDOM(id, markerData.position, markerData.options);
                this.markerCache.set(id, newMarker);

                const markerElement = newMarker.content as HTMLElement;
                markerElement.classList.add('animate-popin');
                newMarker.map = this.map;
                this.visibleMarkers.add(id);

                // TODO: there seems to be a lot of coupling between marker.svelte and this class with those two events, refactor it
                window.dispatchEvent(
                    new CustomEvent('marker-available', {
                        detail: {
                            markerId: id,
                            marker: newMarker,
                        },
                    }),
                );

                // Also trigger a style update event with current state
                window.dispatchEvent(
                    new CustomEvent('marker-style-update', {
                        detail: {
                            markerId: id,
                            isVisited: markerData.options.isVisited,
                            isRemoved: markerData.options.isRemoved,
                        },
                    }),
                );

                setTimeout(() => {
                    markerElement.classList.remove('animate-popin');
                }, 200);
            }
        }
    }

    // this function hides a marker without an animation because we do it when a marker either moves
    // out of viewport bounds (in which case we don't see it, so no need for an animation), or if we
    // hide all markers while moving to deck overlay, in which case an animation causes weird jitter,
    // so for now it is sipler to just hide without animation.
    // There is an edge-case where a marker can be out of viewport only partially, in which case the lack
    // of animation will be visible, but I'm willing to live with that for now
    // TODO: Consider implementing true lazy loading (DOM destruction/recreation) if memory usage becomes an issue.
    // Current approach: DOM caching for better performance and smooth UX
    public hideMarker(id: string) {
        this.visibleMarkers.delete(id);

        const marker = this.markerCache.get(id);
        if (!marker || !marker.map) {
            return;
        }

        marker.map = null;
    }

    public removeMarker(id: string) {
        const marker = this.markerCache.get(id);
        if (!marker) {
            return;
        }

        const markerElement = marker.content as HTMLElement;
        if (markerElement) {
            markerElement.classList.add('animate-popout');
            setTimeout(() => {
                marker.map = null;
                this.removeMarkerFromCache(id);
                this.maybeRestoreReplacedMarker(id);
                markerElement.classList.remove('animate-popout');
            }, 200);
        } else {
            marker.map = null;
            this.removeMarkerFromCache(id);
            this.maybeRestoreReplacedMarker(id);
        }
    }

    private maybeRestoreReplacedMarker(id: string) {
        const replacedMarker = this.replacedMarkers.get(id);
        if (!replacedMarker) {
            return;
        }

        this.markerCache.set(id, replacedMarker.marker);
        this.markerSources.set(id, replacedMarker.source);
        this.replacedMarkers.delete(id);

        // For now always showing restored markers
        // TODO: come up with a better solution
        this.visibleMarkers.add(id);
        replacedMarker.marker.map = this.map;
    }

    private removeMarkerFromCache(id: string) {
        this.markerData.delete(id);
        this.markerCache.delete(id);
        this.markerSources.delete(id);
        this.visibleMarkers.delete(id);
    }

    private collectMarkersInViewport(
        bounds: google.maps.LatLngBounds,
    ): Array<{id: string; position: google.maps.LatLngLiteral}> {
        const allMarkersInViewport: Array<{id: string; position: google.maps.LatLngLiteral}> = [];

        for (const [id, markerData] of this.markerData.entries()) {
            if (bounds.contains(markerData.position)) {
                allMarkersInViewport.push({id, position: markerData.position});
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

        const allMarkerIds = Array.from(this.markerData.keys());
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
        this.markerData.clear();
        this.markerSources.clear();
        this.visibleMarkers.clear();
        this.replacedMarkers.clear();
        this.map = null;
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
