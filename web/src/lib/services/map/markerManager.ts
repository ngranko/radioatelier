import {dragTimeout} from '$lib/stores/map.ts';

export interface MarkerManagerOptions {
    viewportPadding?: number;
    lazyLoadThreshold?: number; // Number of markers before enabling lazy loading
    enableLazyLoading?: boolean; // Enable lazy DOM creation for large datasets
    chunkSize?: number; // Number of markers to process per animation frame
    maxVisibleMarkers?: number; // Maximum markers to display on screen at once
    enableProfiling?: boolean; // Enable verbose profiling of redraw pipeline
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

    // Pre-loaded marker library components
    private advancedMarkerElement?: typeof google.maps.marker.AdvancedMarkerElement;
    private collisionBehavior?: typeof google.maps.CollisionBehavior;

    // Update tracking for chunked processing
    private updateInProgress = false;

    // Profiling state
    private profilingEnabled = false;
    private currentProfile:
        | ({
            startedAt: number;
            timings: {
                total: number;
                updateMarkersInViewport: number;
                scanCached: number;
                scanLazy: number;
                clustering: number;
                sorting: number;
                selection: number;
                visibilityUpdates: number;
            };
            counts: {
                cachedMarkers: number;
                lazyMarkers: number;
                inViewportAll: number;
                clusters: number;
                selectedVisible: number;
                toggledVisibility: number;
                shown: number;
                hidden: number;
                domCreated: number;
                domCreatedLazy: number;
            };
            chunks: {
                count: number;
                totalProcessed: number;
                avgSize: number;
            };
        }
        | null) = null;
    private lastProfile:
        | (typeof this.currentProfile extends null ? never : NonNullable<typeof this.currentProfile>)
        | null = null;

    constructor(options: MarkerManagerOptions = {}) {
        this.options = {
            viewportPadding: 0.1,
            lazyLoadThreshold: 500,
            enableLazyLoading: true,
            chunkSize: 50, // Process 50 markers per animation frame
            maxVisibleMarkers: 50, // Reduced limit to force pruning for testing
            ...options,
        };
        this.profilingEnabled = !!this.options.enableProfiling;
    }

    setProfilingEnabled(enabled: boolean) {
        this.profilingEnabled = enabled;
    }

    getLastProfile() {
        return this.lastProfile;
    }

    private startProfile() {
        if (!this.profilingEnabled) return;
        this.currentProfile = {
            startedAt: performance.now(),
            timings: {
                total: 0,
                updateMarkersInViewport: 0,
                scanCached: 0,
                scanLazy: 0,
                clustering: 0,
                sorting: 0,
                selection: 0,
                visibilityUpdates: 0,
            },
            counts: {
                cachedMarkers: 0,
                lazyMarkers: 0,
                inViewportAll: 0,
                clusters: 0,
                selectedVisible: 0,
                toggledVisibility: 0,
                shown: 0,
                hidden: 0,
                domCreated: 0,
                domCreatedLazy: 0,
            },
            chunks: {
                count: 0,
                totalProcessed: 0,
                avgSize: 0,
            },
        };
    }

    private endProfile() {
        if (!this.profilingEnabled || !this.currentProfile) return;
        this.currentProfile.timings.total = performance.now() - this.currentProfile.startedAt;
        this.currentProfile.chunks.avgSize = this.currentProfile.chunks.count
            ? this.currentProfile.chunks.totalProcessed / this.currentProfile.chunks.count
            : 0;
        this.lastProfile = this.currentProfile;

        // Concise summary log
        console.log('[MarkerManager][Profile] Summary:', {
            totalMs: Math.round(this.currentProfile.timings.total),
            updateMarkersInViewportMs: Math.round(
                this.currentProfile.timings.updateMarkersInViewport,
            ),
            scanCachedMs: Math.round(this.currentProfile.timings.scanCached),
            scanLazyMs: Math.round(this.currentProfile.timings.scanLazy),
            clusteringMs: Math.round(this.currentProfile.timings.clustering),
            sortingMs: Math.round(this.currentProfile.timings.sorting),
            selectionMs: Math.round(this.currentProfile.timings.selection),
            visibilityUpdatesMs: Math.round(this.currentProfile.timings.visibilityUpdates),
            counts: this.currentProfile.counts,
            chunks: this.currentProfile.chunks,
        });

        this.currentProfile = null;
    }

    async initialize(map: google.maps.Map, mapLoader: any) {
        this.map = map;

        // Pre-load marker library components - CRITICAL PERFORMANCE OPTIMIZATION
        try {
            const {AdvancedMarkerElement, CollisionBehavior} =
                await mapLoader.importLibrary('marker');
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
            isLazy,
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
        },
    ): google.maps.marker.AdvancedMarkerElement {
        // Use pre-loaded marker components
        if (!this.advancedMarkerElement || !this.collisionBehavior) {
            throw new Error('Marker library not initialized. Call initialize() first.');
        }

        const creationStart = this.profilingEnabled ? performance.now() : 0;

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

        if (this.profilingEnabled && this.currentProfile) {
            this.currentProfile.counts.domCreated++;
            if (options.source === 'list') {
                this.currentProfile.counts.domCreatedLazy++;
            }
        }

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
                            (marker.content as HTMLElement).classList.add('marker-dragging');
                        }, 500),
                    );
                }
            });
            iconElement.addEventListener('touchstart', () => {
                if (options.onDragStart) {
                    dragTimeout.set(
                        setTimeout(async () => {
                            options.onDragStart!();
                            (marker.content as HTMLElement).classList.add('marker-dragging');
                        }, 500),
                    );
                }
            });
            iconElement.addEventListener('mouseup', () => {
                if (options.onDragEnd) {
                    dragTimeout.remove();
                    options.onDragEnd();
                    (marker.content as HTMLElement).classList.remove('marker-dragging');
                }
            });
            iconElement.addEventListener('touchend', () => {
                if (options.onDragEnd) {
                    dragTimeout.remove();
                    options.onDragEnd();
                    (marker.content as HTMLElement).classList.remove('marker-dragging');
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

        if (this.profilingEnabled && this.currentProfile) {
            // Count createMarkerDOM time within DOM creation if desired later
            void creationStart; // placeholder to avoid unused var if profiling off
        }

        return marker;
    }

    updateMarkerVisibility(id: string, isVisible: boolean) {
        if (this.profilingEnabled && this.currentProfile) {
            this.currentProfile.counts.toggledVisibility++;
        }
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

            if (this.profilingEnabled && this.currentProfile) {
                this.currentProfile.counts.shown++;
            }

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

                if (this.profilingEnabled && this.currentProfile) {
                    this.currentProfile.counts.shown++;
                }

                // Trigger events to notify marker component that lazy marker is now available
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

        if (this.profilingEnabled && this.currentProfile) {
            this.currentProfile.counts.hidden++;
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

        const sectionStart = this.profilingEnabled ? performance.now() : 0;

        const bounds = this.map.getBounds() as google.maps.LatLngBounds;
        const zoom = this.map.getZoom() || 0;

        // Get all markers (both cached and lazy) that are in the viewport
        const allMarkersInViewport: Array<{id: string; position: google.maps.LatLngLiteral}> = [];

        // Add cached markers in viewport
        const scanCachedStart = this.profilingEnabled ? performance.now() : 0;
        for (const [id, marker] of markers.entries()) {
            const position = {
                lat: Number(marker.position?.lat),
                lng: Number(marker.position?.lng),
            };
            if (bounds.contains(position)) {
                allMarkersInViewport.push({id, position});
            }
        }
        if (this.profilingEnabled && this.currentProfile) {
            this.currentProfile.timings.scanCached = performance.now() - scanCachedStart;
            this.currentProfile.counts.cachedMarkers = markers.size;
        }

        // Add lazy markers in viewport
        const scanLazyStart = this.profilingEnabled ? performance.now() : 0;
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
        if (this.profilingEnabled && this.currentProfile) {
            this.currentProfile.timings.scanLazy = performance.now() - scanLazyStart;
            this.currentProfile.counts.lazyMarkers = this.markerData.size;
        }

        // Group markers into clusters based on proximity
        const clusteringStart = this.profilingEnabled ? performance.now() : 0;
        const clusters = this.groupMarkersIntoClusters(allMarkersInViewport, bounds, zoom);
        if (this.profilingEnabled && this.currentProfile) {
            this.currentProfile.timings.clustering = performance.now() - clusteringStart;
            this.currentProfile.counts.inViewportAll = allMarkersInViewport.length;
            this.currentProfile.counts.clusters = clusters.length;
        }

        // Sort clusters by size (largest first) and distance from center
        const sortingStart = this.profilingEnabled ? performance.now() : 0;
        const sortedClusters = this.sortClustersByPriority(clusters, bounds);
        if (this.profilingEnabled && this.currentProfile) {
            this.currentProfile.timings.sorting = performance.now() - sortingStart;
        }

        // Debug logging to see clustering and pruning in action
        console.log(
            `[MarkerManager] Zoom: ${zoom}, Total markers in viewport: ${allMarkersInViewport.length}`,
        );
        console.log(`[MarkerManager] Clusters created: ${clusters.length}`);

        const clusterSizes = clusters.map(c => c.size).sort((a, b) => b - a);
        console.log(`[MarkerManager] Cluster sizes:`, clusterSizes.slice(0, 10)); // Top 10 largest clusters

        // Intelligent cluster-based pruning based on cluster size
        const maxVisibleMarkers = this.options.maxVisibleMarkers || 100;
        const visibleIds = new Set<string>();
        let totalMarkersSelected = 0;

        // Calculate total markers in all clusters
        const totalMarkersInViewport = sortedClusters.reduce(
            (sum, cluster) => sum + cluster.size,
            0,
        );

        // If we have fewer markers than the limit, show all
        if (totalMarkersInViewport <= maxVisibleMarkers) {
            console.log(
                `[MarkerManager] Showing all ${totalMarkersInViewport} markers (under limit)`,
            );
            for (const cluster of sortedClusters) {
                for (const markerId of cluster.markers) {
                    visibleIds.add(markerId);
                }
            }
        } else {
            console.log(
                `[MarkerManager] Pruning required: ${totalMarkersInViewport} > ${maxVisibleMarkers} limit`,
            );
            // Intelligent pruning: allocate markers based on cluster size
            const selectionStart = this.profilingEnabled ? performance.now() : 0;
            for (const cluster of sortedClusters) {
                if (totalMarkersSelected >= maxVisibleMarkers) {
                    break;
                }

                // Calculate how many markers to show from this cluster
                const clusterRatio = cluster.size / totalMarkersInViewport;
                const baseMarkersToShow = Math.max(1, Math.floor(clusterRatio * maxVisibleMarkers));

                // Apply aggressive pruning based on cluster size
                let markersToShow: number;

                if (cluster.size <= 20) {
                    // Small clusters: show most markers
                    markersToShow = Math.max(1, Math.floor(cluster.size * 0.8)); // 80%
                } else if (cluster.size <= 50) {
                    // Medium clusters: show fewer markers
                    markersToShow = Math.max(1, Math.floor(cluster.size * 0.5)); // 50%
                } else if (cluster.size <= 100) {
                    // Large clusters: show even fewer
                    markersToShow = Math.max(1, Math.floor(cluster.size * 0.25)); // 25%
                } else if (cluster.size <= 500) {
                    // Very large clusters: show minimal markers
                    markersToShow = Math.max(1, Math.floor(cluster.size * 0.1)); // 10%
                } else {
                    // Massive clusters: show only a few representative markers
                    markersToShow = Math.max(1, Math.floor(cluster.size * 0.05)); // 5%
                }

                const actualMarkersToShow = Math.min(
                    markersToShow,
                    cluster.size,
                    maxVisibleMarkers - totalMarkersSelected,
                );

                console.log(
                    `[MarkerManager] Cluster size ${cluster.size}: showing ${actualMarkersToShow} markers (${Math.round((actualMarkersToShow / cluster.size) * 100)}%)`,
                );

                // Select markers from this cluster (prioritize by distance from center)
                const clusterMarkers = this.selectMarkersFromCluster(
                    cluster.markers,
                    actualMarkersToShow,
                    bounds,
                );

                for (const markerId of clusterMarkers) {
                    visibleIds.add(markerId);
                    totalMarkersSelected++;
                }
            }
            if (this.profilingEnabled && this.currentProfile) {
                this.currentProfile.timings.selection = performance.now() - selectionStart;
            }
        }

        if (this.profilingEnabled && this.currentProfile) {
            this.currentProfile.counts.selectedVisible = visibleIds.size;
        }

        // Process marker visibility updates in chunks using requestAnimationFrame
        const visibilityStart = this.profilingEnabled ? performance.now() : 0;
        this.processMarkerVisibilityUpdates(visibleIds, markers, () => {
            if (this.profilingEnabled && this.currentProfile) {
                this.currentProfile.timings.visibilityUpdates = performance.now() - visibilityStart;
                this.currentProfile.timings.updateMarkersInViewport = performance.now() - sectionStart;
            }
            this.endProfile();
        });
    }

    private processMarkerVisibilityUpdates(
        visibleIds: Set<string>,
        markers: Map<string, google.maps.marker.AdvancedMarkerElement>,
        onComplete?: () => void,
    ) {
        const allMarkerIds = Array.from(new Set([...markers.keys(), ...this.markerData.keys()]));
        const chunkSize = this.options.chunkSize || 50; // Use configured chunk size
        let currentIndex = 0;

        const processChunk = () => {
            const endIndex = Math.min(currentIndex + chunkSize, allMarkerIds.length);

            for (let i = currentIndex; i < endIndex; i++) {
                const id = allMarkerIds[i];
                const shouldBeVisible = visibleIds.has(id);
                this.updateMarkerVisibility(id, shouldBeVisible);
            }

            if (this.profilingEnabled && this.currentProfile) {
                this.currentProfile.chunks.count++;
                this.currentProfile.chunks.totalProcessed += endIndex - currentIndex;
            }

            currentIndex = endIndex;

            // Continue processing if there are more markers
            if (currentIndex < allMarkerIds.length) {
                requestAnimationFrame(processChunk);
            } else {
                // Update complete, reset flag
                this.updateInProgress = false;
                if (onComplete) onComplete();
            }
        };

        // Start processing chunks
        requestAnimationFrame(processChunk);
    }

    // Method to trigger viewport update from external sources
    triggerViewportUpdate() {
        // Ensure map is ready before updating viewport
        if (!this.map || !this.map.getBounds()) {
            // Map not ready, try again in a moment
            setTimeout(() => this.triggerViewportUpdate(), 100);
            return;
        }

        // Prevent overlapping updates
        if (this.updateInProgress) {
            // Schedule another update after current one completes
            setTimeout(() => this.triggerViewportUpdate(), 50);
            return;
        }

        if (this.profilingEnabled) {
            this.startProfile();
        }

        this.updateInProgress = true;
        this.updateMarkersInViewport(this.markerCache);
    }

    // Select the best markers from a cluster based on distance from center
    private selectMarkersFromCluster(
        markerIds: string[],
        count: number,
        bounds: google.maps.LatLngBounds,
    ): string[] {
        if (markerIds.length <= count) {
            return markerIds; // Return all if we need all or fewer
        }

        const mapCenter = bounds.getCenter();
        const centerPosition = {
            lat: mapCenter.lat(),
            lng: mapCenter.lng(),
        };

        // Get marker positions and calculate distances
        const markersWithDistances = markerIds.map(id => {
            let position: google.maps.LatLngLiteral;

            // Check if marker is in cache
            const cachedMarker = this.markerCache.get(id);
            if (cachedMarker) {
                position = {
                    lat: Number(cachedMarker.position?.lat),
                    lng: Number(cachedMarker.position?.lng),
                };
            } else {
                // Check if marker is in lazy data
                const lazyData = this.markerData.get(id);
                if (lazyData) {
                    position = lazyData.position;
                } else {
                    return {id, distance: Infinity}; // Skip if not found
                }
            }

            const distance = this.calculateDistance(position, centerPosition);
            return {id, distance};
        });

        // Sort by distance (closest first) and take the requested count
        return markersWithDistances
            .sort((a, b) => a.distance - b.distance)
            .slice(0, count)
            .map(marker => marker.id);
    }

    // Cleanup method
    destroy() {
        this.markerCache.clear();
        this.markerData.clear();
        this.markerSources.clear();
        this.visibleMarkers.clear();
        this.replacedMarkers.clear();
        this.map = null;
    }

    // Optimized clustering with spatial indexing
    private createSpatialIndex(
        markers: Array<{id: string; position: google.maps.LatLngLiteral}>,
        gridSize: number,
    ) {
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
        // More aggressive clustering radius that creates visible clusters
        let clusterRadius: number;

        if (zoom <= 10) {
            clusterRadius = 0.1; // Very large clusters at low zoom
        } else if (zoom <= 12) {
            clusterRadius = 0.05; // Large clusters
        } else if (zoom <= 14) {
            clusterRadius = 0.02; // Medium clusters
        } else if (zoom <= 16) {
            clusterRadius = 0.01; // Small clusters
        } else {
            clusterRadius = 0.005; // Very small clusters at high zoom
        }

        // Always use spatial indexing - it's faster for all dataset sizes
        return this.groupMarkersWithSpatialIndex(markers, clusterRadius);
    }

    private groupMarkersWithSpatialIndex(
        markers: Array<{id: string; position: google.maps.LatLngLiteral}>,
        clusterRadius: number,
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
}
