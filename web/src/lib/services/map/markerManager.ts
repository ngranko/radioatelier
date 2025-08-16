import {dragTimeout} from '$lib/stores/map.ts';

export interface MarkerManagerOptions {
    viewportPadding?: number;
    lazyLoadThreshold?: number; // Number of markers before enabling lazy loading
    enableLazyLoading?: boolean; // Enable lazy DOM creation for large datasets
}

export class MarkerManager {
    private map: google.maps.Map | null = null;
    private options: MarkerManagerOptions;
    private visibleMarkers = new Set<string>();
    private markerCache = new Map<string, google.maps.marker.AdvancedMarkerElement>();
    private markerSources = new Map<string, 'map' | 'list' | 'search'>();
    private markerData = new Map<string, {
        position: google.maps.LatLngLiteral;
        options: any;
        isLazy: boolean; // Whether this marker should use lazy DOM creation
    }>();
    private replacedMarkers = new Map<
        string,
        {
            marker: google.maps.marker.AdvancedMarkerElement;
            source: 'map' | 'list' | 'search';
            wasVisible: boolean;
        }
    >();
    
    // Pre-loaded marker library components
    private advancedMarkerElement?: typeof google.maps.marker.AdvancedMarkerElement;
    private collisionBehavior?: typeof google.maps.CollisionBehavior;

    constructor(options: MarkerManagerOptions = {}) {
        this.options = {
            viewportPadding: 0.1,
            lazyLoadThreshold: 500,
            enableLazyLoading: true,
            ...options,
        };
    }

    async initialize(map: google.maps.Map, mapLoader: any) {
        this.map = map;
        
        // Pre-load marker library components - CRITICAL PERFORMANCE OPTIMIZATION
        try {
            const {AdvancedMarkerElement, CollisionBehavior} = await mapLoader.importLibrary('marker');
            this.advancedMarkerElement = AdvancedMarkerElement;
            this.collisionBehavior = CollisionBehavior;
        } catch (error) {
            console.error('Failed to pre-load marker library:', error);
        }
    }

    createMarker(
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
        // Use lazy loading for all list markers for consistent behavior and better performance
        const isLazy = (this.options.enableLazyLoading ?? true) && options.source === 'list';
        
        // Check if marker already exists in cache
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
                // Regular marker should not replace search marker
                return existingMarker;
            } else if (existingSource === options.source) {
                // Same source, return existing marker
                return existingMarker;
            }
        }

        // Store marker data
        this.markerData.set(id, {
            position,
            options,
            isLazy
        });

        // For lazy markers, just store data and return null
        if (isLazy) {
            this.markerSources.set(id, options.source);
            return null; // No DOM created yet
        }

        // For non-lazy markers, create DOM immediately
        return this.createMarkerDOM(id, position, options);
    }

    // Create marker DOM element (separate method for lazy loading)
    private createMarkerDOM(
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
        }
    ): google.maps.marker.AdvancedMarkerElement {
        // Use pre-loaded marker components
        if (!this.advancedMarkerElement || !this.collisionBehavior) {
            throw new Error('Marker library not initialized. Call initialize() first.');
        }

        // Create marker element with proper class list
        const iconElement = document.createElement('div');
        iconElement.style.backgroundColor = options.color;
        iconElement.innerHTML = `<i class="${options.icon}" style="pointer-events:none;"></i>`;
        iconElement.className =
            'w-6 h-6 translate-y-1/2 flex justify-center items-center rounded-full text-sm text-white transition-transform transition-opacity duration-100 ease-in-out animate-popin';

        // Create marker using pre-loaded components
        const marker = new this.advancedMarkerElement({
            position,
            content: iconElement,
            collisionBehavior: this.collisionBehavior.REQUIRED,
            gmpClickable: true,
            zIndex: options.source === 'search' ? 1 : 0,
        });

        // Add click listener
        if (options.onClick) {
            marker.addListener('gmp-click', options.onClick);
        }

        // Add drag listeners if needed
        if (options.isDraggable) {
            iconElement.addEventListener('mousedown', () => {
                if (options.onDragStart) {
                    dragTimeout.set(
                        setTimeout(async () => {
                            options.onDragStart!();
                            marker.content!.classList.add('marker-dragging');
                        }, 500),
                    );
                }
            });
            iconElement.addEventListener('touchstart', () => {
                if (options.onDragStart) {
                    dragTimeout.set(
                        setTimeout(async () => {
                            options.onDragStart!();
                            marker.content!.classList.add('marker-dragging');
                        }, 500),
                    );
                }
            });
            iconElement.addEventListener('mouseup', () => {
                if (options.onDragEnd) {
                    dragTimeout.remove();
                    options.onDragEnd();
                    marker.content!.classList.remove('marker-dragging');
                }
            });
            iconElement.addEventListener('touchend', () => {
                if (options.onDragEnd) {
                    dragTimeout.remove();
                    options.onDragEnd();
                    marker.content!.classList.remove('marker-dragging');
                }
            });
        }

        // Cache the marker and track its source
        this.markerCache.set(id, marker);
        this.markerSources.set(id, options.source);

        // For map-clicked markers, show them immediately
        if (options.source === 'map' || options.source === 'search') {
            this.visibleMarkers.add(id);
            marker.map = this.map;
        }

        // Remove animation class after delay
        setTimeout(() => {
            iconElement.classList.remove('animate-popin');
        }, 200);

        return marker;
    }

    updateMarkerVisibility(id: string, isVisible: boolean) {
        if (isVisible && !this.visibleMarkers.has(id)) {
            this.showMarker(id);
        } else if (!isVisible && this.visibleMarkers.has(id)) {
            this.hideMarker(id);
        }
    }

    // Show marker (create DOM if lazy, or just show if exists)
    showMarker(id: string) {
        const marker = this.markerCache.get(id);
        
        if (marker) {
            // Marker already exists, just show it
            const markerElement = marker.content as HTMLElement;
            markerElement.classList.add('animate-popin');
            this.visibleMarkers.add(id);
            marker.map = this.map;

            setTimeout(() => {
                markerElement.classList.remove('animate-popin');
            }, 200);
        } else {
            // Marker doesn't exist, check if it's lazy
            const markerData = this.markerData.get(id);
            if (markerData?.isLazy) {
                // Create DOM for lazy marker
                const newMarker = this.createMarkerDOM(id, markerData.position, markerData.options);
                this.markerCache.set(id, newMarker);
                
                // Show the newly created marker
                const markerElement = newMarker.content as HTMLElement;
                markerElement.classList.add('animate-popin');
                this.visibleMarkers.add(id);
                newMarker.map = this.map;

                // Trigger events to notify marker component that lazy marker is now available
                window.dispatchEvent(new CustomEvent('marker-available', { 
                    detail: { 
                        markerId: id,
                        marker: newMarker
                    } 
                }));

                // Also trigger a style update event with current state
                window.dispatchEvent(new CustomEvent('marker-style-update', { 
                    detail: { 
                        markerId: id,
                        isVisited: markerData.options.isVisited,
                        isRemoved: markerData.options.isRemoved
                    } 
                }));

                setTimeout(() => {
                    markerElement.classList.remove('animate-popin');
                }, 200);
            }
        }
    }

    // Hide marker (keep DOM, just hide from map)
    // TODO: Consider implementing true lazy loading (DOM destruction/recreation) if memory usage becomes an issue.
    // Current approach: DOM caching for better performance and smooth UX
    // Alternative approach: Destroy DOM when hidden, recreate when visible (minimal memory, slower visibility changes)
    hideMarker(id: string) {
        const marker = this.markerCache.get(id);
        if (!marker) {
            return;
        }

        const markerElement = marker.content as HTMLElement;
        this.visibleMarkers.delete(id);

        // Add removal animation before hiding
        if (markerElement) {
            markerElement.classList.add('animate-popout');
            setTimeout(() => {
                marker.map = null;
                markerElement.classList.remove('animate-popout');
            }, 200);
        } else {
            marker.map = null;
        }
    }

    removeMarker(id: string) {
        const marker = this.markerCache.get(id);
        if (!marker) {
            return;
        }

        // Add removal animation before hiding
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

        // Restore the replaced marker
        this.markerCache.set(id, replacedMarker.marker);
        this.markerSources.set(id, replacedMarker.source);
        this.replacedMarkers.delete(id);

        // For now always showing restored markers
        // TODO: come up with a better solution
        this.visibleMarkers.add(id);
        replacedMarker.marker.map = this.map;
    }

    // Check if a marker is a search marker
    isSearchMarker(id: string): boolean {
        return this.markerSources.get(id) === 'search';
    }

    // Check if a marker exists in cache
    hasMarker(id: string): boolean {
        return this.markerCache.has(id);
    }

    // Get the source of a marker
    getMarkerSource(id: string): 'map' | 'list' | 'search' | undefined {
        return this.markerSources.get(id);
    }

    private removeMarkerFromCache(id: string) {
        this.markerCache.delete(id);
        this.markerSources.delete(id);
        this.visibleMarkers.delete(id);
    }

    private updateMarkersInViewport(
        markers: Map<string, google.maps.marker.AdvancedMarkerElement>,
    ) {
        if (!this.map || !this.map.getBounds()) {
            return;
        }

        const bounds = this.map.getBounds() as google.maps.LatLngBounds;
        const zoom = this.map.getZoom() || 0;

        // Get all markers (both cached and lazy) that are in the viewport
        const allMarkersInViewport: Array<{id: string; position: google.maps.LatLngLiteral}> = [];

        // Add cached markers in viewport
        for (const [id, marker] of markers.entries()) {
            const position = {
                lat: Number(marker.position?.lat),
                lng: Number(marker.position?.lng),
            };
            if (bounds.contains(position)) {
                allMarkersInViewport.push({id, position});
            }
        }

        // Add lazy markers in viewport
        for (const [id, markerData] of this.markerData.entries()) {
            // Skip if already in cache (handled above)
            if (markers.has(id)) {
                continue;
            }
            
            // Process all lazy markers
            if (markerData.isLazy && bounds.contains(markerData.position)) {
                allMarkersInViewport.push({id, position: markerData.position});
            }
        }

        // Group markers into clusters based on proximity
        const clusters = this.groupMarkersIntoClusters(allMarkersInViewport, bounds, zoom);

        // Sort clusters by size (largest first) and distance from center
        const sortedClusters = this.sortClustersByPriority(clusters, bounds);

        // Show markers with a reasonable limit for performance
        const maxVisibleMarkers = 500; // Reasonable limit for smooth performance
        const visibleIds = new Set<string>();
        let markerCount = 0;
        
        for (const cluster of sortedClusters) {
            if (markerCount >= maxVisibleMarkers) {
                break;
            }
            
            for (const markerId of cluster.markers) {
                if (markerCount >= maxVisibleMarkers) {
                    break;
                }
                visibleIds.add(markerId);
                markerCount++;
            }
        }

        // Update marker visibility for all markers (cached and lazy)
        const allMarkerIds = new Set([...markers.keys(), ...this.markerData.keys()]);
        for (const id of allMarkerIds) {
            const shouldBeVisible = visibleIds.has(id);
            this.updateMarkerVisibility(id, shouldBeVisible);
        }
    }

    // Method to trigger viewport update from external sources
    triggerViewportUpdate() {
        // Ensure map is ready before updating viewport
        if (!this.map || !this.map.getBounds()) {
            // Map not ready, try again in a moment
            setTimeout(() => this.triggerViewportUpdate(), 100);
            return;
        }
        
        this.updateMarkersInViewport(this.markerCache);
    }

    // Optimized clustering with spatial indexing
    private createSpatialIndex(markers: Array<{id: string; position: google.maps.LatLngLiteral}>, gridSize: number) {
        const spatialIndex = new Map<string, string[]>();

        for (const marker of markers) {
            const gridX = Math.floor(marker.position.lng / gridSize);
            const gridY = Math.floor(marker.position.lat / gridSize);
            const gridKey = `${gridX},${gridY}`;

            if (!spatialIndex.has(gridKey)) {
                spatialIndex.set(gridKey, []);
            }
            spatialIndex.get(gridKey)!.push(marker.id);
        }

        return spatialIndex;
    }

    private groupMarkersIntoClusters(
        markers: Array<{id: string; position: google.maps.LatLngLiteral}>,
        bounds: google.maps.LatLngBounds,
        zoom: number,
    ): Array<{center: google.maps.LatLngLiteral; markers: string[]; size: number}> {
        const clusterRadius = Math.max(0.001, 0.01 / Math.pow(2, zoom - 10)); // Adjust based on zoom level

        // Always use spatial indexing - it's faster for all dataset sizes
        return this.groupMarkersWithSpatialIndex(markers, clusterRadius);
    }

    private groupMarkersWithSpatialIndex(
        markers: Array<{id: string; position: google.maps.LatLngLiteral}>,
        clusterRadius: number
    ): Array<{center: google.maps.LatLngLiteral; markers: string[]; size: number}> {
        const clusters: Array<{
            center: google.maps.LatLngLiteral;
            markers: string[];
            size: number;
        }> = [];

        // Create spatial index with smaller grid for clustering
        const gridSize = clusterRadius * 2;
        const spatialIndex = this.createSpatialIndex(markers, gridSize);

        // Process each grid cell
        for (const [gridKey, markerIds] of spatialIndex.entries()) {
            if (markerIds.length === 1) {
                // Single marker, no clustering needed
                const marker = markers.find(m => m.id === markerIds[0])!;
                clusters.push({
                    center: marker.position,
                    markers: markerIds,
                    size: 1,
                });
            } else {
                // Multiple markers in this grid cell, create cluster
                const gridMarkers = markers.filter(m => markerIds.includes(m.id));
                const center = this.calculateClusterCenter(markerIds, markers);
                
                clusters.push({
                    center,
                    markers: markerIds,
                    size: markerIds.length,
                });
            }
        }

        return clusters;
    }

    private sortClustersByPriority(
        clusters: Array<{center: google.maps.LatLngLiteral; markers: string[]; size: number}>,
        bounds: google.maps.LatLngBounds,
    ): Array<{center: google.maps.LatLngLiteral; markers: string[]; size: number}> {
        const mapCenter = bounds.getCenter();

        return clusters.sort((a, b) => {
            // First priority: smaller clusters (individual markers first)
            if (a.size !== b.size) {
                return a.size - b.size;
            }

            // Second priority: closer to map center
            const distanceA = this.calculateDistance(a.center, {
                lat: mapCenter.lat(),
                lng: mapCenter.lng(),
            });
            const distanceB = this.calculateDistance(b.center, {
                lat: mapCenter.lat(),
                lng: mapCenter.lng(),
            });
            return distanceA - distanceB;
        });
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

    private calculateClusterCenter(
        markerIds: string[],
        allMarkers: Array<{id: string; position: google.maps.LatLngLiteral}>,
    ): google.maps.LatLngLiteral {
        const clusterMarkers = allMarkers.filter(m => markerIds.includes(m.id));

        if (clusterMarkers.length === 0) {
            return {lat: 0, lng: 0};
        }

        const totalLat = clusterMarkers.reduce((sum, m) => sum + m.position.lat, 0);
        const totalLng = clusterMarkers.reduce((sum, m) => sum + m.position.lng, 0);

        return {
            lat: totalLat / clusterMarkers.length,
            lng: totalLng / clusterMarkers.length,
        };
    }

    destroy() {
        this.markerCache.forEach(marker => {
            marker.map = null;
        });
        this.markerCache.clear();
        this.visibleMarkers.clear();
        this.markerSources.clear();
        this.replacedMarkers.clear();
    }
}
