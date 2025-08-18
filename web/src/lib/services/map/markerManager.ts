import {getRasterIcon, makeCircleSvgDataUrl} from '$lib/services/map/iconRaster';
import {dragTimeout} from '$lib/stores/map.ts';

export interface MarkerManagerOptions {
    viewportPadding?: number;
    lazyLoadThreshold?: number; // Number of markers before enabling lazy loading
    enableLazyLoading?: boolean; // Enable lazy DOM creation for large datasets
    chunkSize?: number; // Number of markers to process per animation frame
    maxVisibleMarkers?: number; // Maximum markers to display on screen at once
    enableProfiling?: boolean; // Enable verbose profiling of redraw pipeline
    animationsEnabled?: boolean; // Enable marker CSS animations
    smallBatchThreshold?: number; // Apply all toggles in one frame if under this
    bulkAnimationThreshold?: number; // Disable animations when many toggles
    smallClusterMaxSize?: number; // Clusters up to this size render fully
    clusterSubgridFactor?: number; // Sub-grid factor for pruning within large clusters
    maxMarkersPerCluster?: number; // Hard cap per large cluster after pruning
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

    // Rendering mode flag
    private useRasterIcons = false;

    // Update tracking for chunked processing
    private updateInProgress = false;

    // Cluster selection cache to stabilize visible picks within clusters
    private clusterSelectionCache = new Map<string, {selectedIds: string[]; membersKey: string}>();

    // Profiling state
    private profilingEnabled = false;
    private currentProfile: {
        startedAt: number;
        timings: {
            total: number;
            updateMarkersInViewport: number;
            scanCached: number;
            scanLazy: number;
            clustering: number;
            sorting: number;
            selection: number;
            planVisibility: number;
            visibilityUpdates: number;
        };
        counts: {
            cachedMarkers: number;
            lazyMarkers: number;
            inViewportAll: number;
            clusters: number;
            largeClusters: number;
            selectedAfterCluster: number;
            selectedAfterTrim: number;
            selectedVisible: number;
            plannedShow: number;
            plannedHide: number;
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
    } | null = null;
    private lastProfile:
        | (typeof this.currentProfile extends null
              ? never
              : NonNullable<typeof this.currentProfile>)
        | null = null;

    constructor(options: MarkerManagerOptions = {}) {
        this.options = {
            viewportPadding: 0.1,
            lazyLoadThreshold: 500,
            enableLazyLoading: true,
            chunkSize: 50, // Process 50 markers per animation frame
            maxVisibleMarkers: 1000,
            animationsEnabled: true,
            smallBatchThreshold: 200,
            bulkAnimationThreshold: 150,
            smallClusterMaxSize: 3,
            clusterSubgridFactor: 0.5,
            maxMarkersPerCluster: 50,
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

    getOptions(): MarkerManagerOptions {
        return {...this.options};
    }

    updateOptions(partial: Partial<MarkerManagerOptions>) {
        this.options = {
            ...this.options,
            ...partial,
        };
        // Re-render according to new rules
        this.triggerViewportUpdate();
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
                planVisibility: 0,
                visibilityUpdates: 0,
            },
            counts: {
                cachedMarkers: 0,
                lazyMarkers: 0,
                inViewportAll: 0,
                clusters: 0,
                largeClusters: 0,
                selectedAfterCluster: 0,
                selectedAfterTrim: 0,
                selectedVisible: 0,
                plannedShow: 0,
                plannedHide: 0,
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
            planVisibilityMs: Math.round(this.currentProfile.timings.planVisibility),
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

        // Toggle raster mode via query parameter ?raster
        try {
            const qs = new URLSearchParams(window.location.search);
            this.useRasterIcons = qs.has('raster');
        } catch {}
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

        // Create marker content element
        let contentEl: HTMLElement;
        if (this.useRasterIcons) {
            // Wrap the image and visually anchor at bottom via translate-y-1/2
            const wrapper = document.createElement('div');
            wrapper.className =
                'w-6 h-6 translate-y-1/2 rounded-full flex justify-center items-center transition-transform transition-opacity duration-100 ease-in-out animate-popin';
            wrapper.style.overflow = 'visible';
            wrapper.style.backgroundColor = options.color;
            const img = document.createElement('img');
            img.alt = 'marker';
            img.draggable = false;
            img.style.display = 'block';
            img.style.width = '24px';
            img.style.height = '24px';
            img.style.borderRadius = '9999px';
            img.style.pointerEvents = 'none';
            // Immediate placeholder to avoid broken image flash
            img.src = makeCircleSvgDataUrl(options.color, 24);
            void getRasterIcon({iconClass: options.icon, color: options.color, sizePx: 24}).then(
                icon => {
                    img.src = icon.url;
                },
            );
            wrapper.appendChild(img);
            contentEl = wrapper;
        } else {
            const iconElement = document.createElement('div');
            iconElement.className =
                'w-6 h-6 translate-y-1/2 flex justify-center items-center rounded-full transition-transform transition-opacity duration-100 ease-in-out animate-popin';
            iconElement.style.overflow = 'visible';
            iconElement.style.backgroundColor = options.color;
            iconElement.classList.add('text-sm', 'text-white');
            iconElement.innerHTML = `<i class="${options.icon}" style="pointer-events:none;"></i>`;
            contentEl = iconElement;
        }

        // Create marker using pre-loaded components
        const marker = new this.advancedMarkerElement({
            position,
            content: contentEl,
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
            contentEl.addEventListener('mousedown', () => {
                if (options.onDragStart) {
                    dragTimeout.set(
                        setTimeout(async () => {
                            options.onDragStart!();
                            (marker.content as HTMLElement).classList.add('marker-dragging');
                        }, 500),
                    );
                }
            });
            contentEl.addEventListener('touchstart', () => {
                if (options.onDragStart) {
                    dragTimeout.set(
                        setTimeout(async () => {
                            options.onDragStart!();
                            (marker.content as HTMLElement).classList.add('marker-dragging');
                        }, 500),
                    );
                }
            });
            contentEl.addEventListener('mouseup', () => {
                if (options.onDragEnd) {
                    dragTimeout.remove();
                    options.onDragEnd();
                    (marker.content as HTMLElement).classList.remove('marker-dragging');
                }
            });
            contentEl.addEventListener('touchend', () => {
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
            contentEl.classList.remove('animate-popin');
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

    // --- Viewport pipeline helpers ---
    private collectMarkersInViewport(
        markers: Map<string, google.maps.marker.AdvancedMarkerElement>,
        bounds: google.maps.LatLngBounds,
    ): Array<{id: string; position: google.maps.LatLngLiteral}> {
        const allMarkersInViewport: Array<{id: string; position: google.maps.LatLngLiteral}> = [];

        // Cached markers
        const scanCachedStart = this.profilingEnabled ? performance.now() : 0;
        // Numeric bounds check (faster than repeatedly calling bounds.contains)
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        const minLat = sw.lat();
        const minLng = sw.lng();
        const maxLat = ne.lat();
        const maxLng = ne.lng();

        for (const [id, marker] of markers.entries()) {
            const lat = Number(marker.position?.lat);
            const lng = Number(marker.position?.lng);
            if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
                allMarkersInViewport.push({id, position: {lat, lng}});
            }
        }
        if (this.profilingEnabled && this.currentProfile) {
            this.currentProfile.timings.scanCached = performance.now() - scanCachedStart;
            this.currentProfile.counts.cachedMarkers = markers.size;
        }

        // Lazy markers
        const scanLazyStart = this.profilingEnabled ? performance.now() : 0;
        for (const [id, markerData] of this.markerData.entries()) {
            if (markers.has(id)) continue; // already captured above
            const lat = markerData.position.lat;
            const lng = markerData.position.lng;
            if (
                markerData.isLazy &&
                lat >= minLat &&
                lat <= maxLat &&
                lng >= minLng &&
                lng <= maxLng
            ) {
                allMarkersInViewport.push({id, position: markerData.position});
            }
        }
        if (this.profilingEnabled && this.currentProfile) {
            this.currentProfile.timings.scanLazy = performance.now() - scanLazyStart;
            this.currentProfile.counts.lazyMarkers = this.markerData.size;
        }

        return allMarkersInViewport;
    }

    private sortMarkersByDistance(
        markers: Array<{id: string; position: google.maps.LatLngLiteral}>,
        center: google.maps.LatLngLiteral,
    ): Array<{id: string; position: google.maps.LatLngLiteral}> {
        const sortingStart = this.profilingEnabled ? performance.now() : 0;
        const sorted = markers.sort((a, b) => {
            const distanceA = this.calculateDistance(a.position, center);
            const distanceB = this.calculateDistance(b.position, center);
            return distanceA - distanceB;
        });
        if (this.profilingEnabled && this.currentProfile) {
            this.currentProfile.timings.sorting = performance.now() - sortingStart;
            this.currentProfile.counts.inViewportAll = sorted.length;
        }
        return sorted;
    }

    private pickVisibleIds(
        sortedMarkers: Array<{id: string; position: google.maps.LatLngLiteral}>,
        maxVisibleMarkers: number,
    ): Set<string> {
        const selectionStart = this.profilingEnabled ? performance.now() : 0;
        const visibleIds = new Set<string>();
        if (sortedMarkers.length <= maxVisibleMarkers) {
            for (const marker of sortedMarkers) {
                visibleIds.add(marker.id);
            }
        } else {
            for (let i = 0; i < maxVisibleMarkers; i++) {
                visibleIds.add(sortedMarkers[i].id);
            }
        }
        if (this.profilingEnabled && this.currentProfile) {
            this.currentProfile.timings.selection = performance.now() - selectionStart;
            this.currentProfile.counts.selectedVisible = visibleIds.size;
        }
        return visibleIds;
    }

    // (overlay positions helper removed)

    private updateMarkersInViewport(
        markers: Map<string, google.maps.marker.AdvancedMarkerElement>,
    ) {
        if (!this.map || !this.map.getBounds()) {
            return;
        }

        const sectionStart = this.profilingEnabled ? performance.now() : 0;
        const bounds = this.map.getBounds() as google.maps.LatLngBounds;

        // 1) Collect all viewport markers (cached + lazy)
        const allMarkersInViewport = this.collectMarkersInViewport(markers, bounds);

        // 2) Cluster in-grid, then apply hybrid pruning
        const center = bounds.getCenter();
        const centerPosition = {lat: center.lat(), lng: center.lng()};
        // Distance-sort and simple pick (reverting unstable clustering)
        const sortedMarkers = this.sortMarkersByDistance(allMarkersInViewport, centerPosition);
        const maxVisibleMarkers = this.options.maxVisibleMarkers || 200;
        const visibleIds = this.pickVisibleIds(sortedMarkers, maxVisibleMarkers);

        // Determine batch strategy and animation policy
        const totalKnown = this.markerCache.size + this.markerData.size;
        const smallBatchThreshold = this.options.smallBatchThreshold ?? 200;
        const bulkAnimationThreshold = this.options.bulkAnimationThreshold ?? 150;
        const plannedToggles = Math.min(
            totalKnown,
            Math.abs(visibleIds.size - this.visibleMarkers.size),
        );
        const disableAnimationsForBulk = plannedToggles > bulkAnimationThreshold;

        // 4) Plan visibility changes (diff current vs target) for profiling
        const planStart = this.profilingEnabled ? performance.now() : 0;
        let plannedShow = 0;
        let plannedHide = 0;
        const allMarkerIds = new Set<string>([...markers.keys(), ...this.markerData.keys()]);
        for (const id of allMarkerIds) {
            const currentlyVisible = this.visibleMarkers.has(id);
            const shouldBeVisible = visibleIds.has(id);
            if (currentlyVisible !== shouldBeVisible) {
                if (shouldBeVisible) plannedShow++;
                else plannedHide++;
            }
        }
        if (this.profilingEnabled && this.currentProfile) {
            this.currentProfile.timings.planVisibility = performance.now() - planStart;
            this.currentProfile.counts.plannedShow = plannedShow;
            this.currentProfile.counts.plannedHide = plannedHide;
        }

        // 5) Process marker visibility updates in chunks using requestAnimationFrame
        const visibilityStart = this.profilingEnabled ? performance.now() : 0;
        if (plannedToggles <= smallBatchThreshold) {
            // Apply all toggles in one frame for small batches
            requestAnimationFrame(() => {
                this.processMarkerVisibilityBatch(visibleIds, markers, disableAnimationsForBulk);
                if (this.profilingEnabled && this.currentProfile) {
                    this.currentProfile.timings.visibilityUpdates =
                        performance.now() - visibilityStart;
                    this.currentProfile.timings.updateMarkersInViewport =
                        performance.now() - sectionStart;
                }
                this.updateInProgress = false;
                this.endProfile();
            });
            return;
        }

        this.processMarkerVisibilityUpdates(visibleIds, markers, () => {
            if (this.profilingEnabled && this.currentProfile) {
                this.currentProfile.timings.visibilityUpdates = performance.now() - visibilityStart;
                this.currentProfile.timings.updateMarkersInViewport =
                    performance.now() - sectionStart;
            }
            this.endProfile();
        });
    }

    // Hybrid clustering:
    // - Build coarse grid clusters
    // - If cluster size <= smallClusterMaxSize: render all
    // - Else: subdivide area and select representatives by proximity to subcell centers
    private hybridClusterAndSelectIds(
        markers: Array<{id: string; position: google.maps.LatLngLiteral}>,
        center: google.maps.LatLngLiteral,
        bounds: google.maps.LatLngBounds,
        zoom: number,
    ): Set<string> {
        const maxVisibleMarkers = this.options.maxVisibleMarkers || 200;
        const smallMax = this.options.smallClusterMaxSize ?? 3;
        const subFactor = this.options.clusterSubgridFactor ?? 0.5;
        const maxPerCluster = this.options.maxMarkersPerCluster ?? 50;

        // World-fixed grid derived from zoom (stable while panning)
        const gridDiv = Math.max(16, Math.min(64, Math.round(zoom * 2 + 12)));
        const cellLng = 360 / gridDiv; // -180..180
        const cellLat = 170 / gridDiv; // approx -85..85 to avoid poles distortion

        const grid = new Map<string, Array<{id: string; position: google.maps.LatLngLiteral}>>();
        for (const m of markers) {
            const gx = Math.floor((m.position.lng + 180) / cellLng);
            const gy = Math.floor((m.position.lat + 85) / cellLat);
            const key = `${gx}:${gy}`;
            if (!grid.has(key)) grid.set(key, []);
            grid.get(key)!.push(m);
        }

        const selected = new Set<string>();
        if (this.profilingEnabled && this.currentProfile) {
            this.currentProfile.counts.clusters = grid.size;
        }

        for (const [cellKey, cluster] of grid.entries()) {
            if (cluster.length <= smallMax) {
                for (const m of cluster) selected.add(m.id);
                continue;
            }
            if (this.profilingEnabled && this.currentProfile) {
                this.currentProfile.counts.largeClusters++;
            }

            // Subdivide fixed cell area for stable picks
            const [gxStr, gyStr] = cellKey.split(':');
            const gx = Number(gxStr);
            const gy = Number(gyStr);
            const minLng = gx * cellLng - 180;
            const maxLng = minLng + cellLng;
            const minLat = gy * cellLat - 85;
            const maxLat = minLat + cellLat;
            const subLat = Math.max(1e-6, (maxLat - minLat) * subFactor);
            const subLng = Math.max(1e-6, (maxLng - minLng) * subFactor);

            const subgrid = new Map<
                string,
                Array<{id: string; position: google.maps.LatLngLiteral}>
            >();
            for (const m of cluster) {
                const sx = Math.floor((m.position.lng - minLng) / subLng);
                const sy = Math.floor((m.position.lat - minLat) / subLat);
                const k = `${sx}:${sy}`;
                if (!subgrid.has(k)) subgrid.set(k, []);
                subgrid.get(k)!.push(m);
            }

            // Cache key for cluster membership to keep picks stable while dragging
            const membersKey = cluster
                .map(m => m.id)
                .sort()
                .join(',');
            // Use fixed cell and zoom as part of cache key
            const clusterKey = `${gx}:${gy}:z${zoom}|${cluster.length}`;
            const cached = this.clusterSelectionCache.get(clusterKey);
            let picks: string[] | null = null;
            if (cached && cached.membersKey === membersKey) {
                picks = cached.selectedIds.slice(0);
            }
            if (!picks) {
                picks = [];
                for (const [k, list] of subgrid.entries()) {
                    const [sxStr, syStr] = k.split(':');
                    const sx = Number(sxStr);
                    const sy = Number(syStr);
                    const cx = minLng + (sx + 0.5) * subLng;
                    const cy = minLat + (sy + 0.5) * subLat;
                    let bestId = list[0].id;
                    let bestDist = Infinity;
                    for (const m of list) {
                        const d = this.calculateDistance(m.position, {lat: cy, lng: cx});
                        if (d < bestDist) {
                            bestDist = d;
                            bestId = m.id;
                        }
                    }
                    picks.push(bestId);
                }
                this.clusterSelectionCache.set(clusterKey, {
                    selectedIds: picks.slice(0),
                    membersKey,
                });
            }

            // Hard cap per cluster to avoid overdraw
            for (const id of picks.slice(0, maxPerCluster)) selected.add(id);
        }

        // If still over maxVisibleMarkers, trim by distance to map center
        if (selected.size > maxVisibleMarkers) {
            const arr = Array.from(selected);
            arr.sort((a, b) => {
                const pa = markers.find(m => m.id === a)!.position;
                const pb = markers.find(m => m.id === b)!.position;
                return this.calculateDistance(pa, center) - this.calculateDistance(pb, center);
            });
            const trimmed = new Set(arr.slice(0, maxVisibleMarkers));
            if (this.profilingEnabled && this.currentProfile) {
                this.currentProfile.counts.selectedAfterTrim = trimmed.size;
            }
            return trimmed;
        }

        return selected;
    }

    // Apply visibility changes immediately (single frame), with optional animation suppression
    private processMarkerVisibilityBatch(
        visibleIds: Set<string>,
        markers: Map<string, google.maps.marker.AdvancedMarkerElement>,
        disableAnimations: boolean,
    ) {
        const originalAnimationsEnabled = this.options.animationsEnabled !== false;
        const skipAnimations = disableAnimations && originalAnimationsEnabled;

        // Temporarily disable animations by skipping class toggles
        const prevShow = this.showMarker;
        const prevHide = this.hideMarker;
        if (skipAnimations) {
            this.showMarker = (id: string) => {
                const marker = this.markerCache.get(id);
                if (marker) {
                    this.visibleMarkers.add(id);
                    marker.map = this.map;
                    if (this.profilingEnabled && this.currentProfile)
                        this.currentProfile.counts.shown++;
                } else {
                    const data = this.markerData.get(id);
                    if (data?.isLazy) {
                        const newMarker = this.createMarkerDOM(id, data.position, data.options);
                        this.markerCache.set(id, newMarker);
                        this.visibleMarkers.add(id);
                        newMarker.map = this.map;
                        if (this.profilingEnabled && this.currentProfile)
                            this.currentProfile.counts.shown++;
                    }
                }
            };
            this.hideMarker = (id: string) => {
                const marker = this.markerCache.get(id);
                if (!marker) return;
                this.visibleMarkers.delete(id);
                marker.map = null;
                if (this.profilingEnabled && this.currentProfile)
                    this.currentProfile.counts.hidden++;
            };
        }

        // Apply diff
        const allIds = new Set<string>([...markers.keys(), ...this.markerData.keys()]);
        for (const id of allIds) {
            const shouldBeVisible = visibleIds.has(id);
            const isVisible = this.visibleMarkers.has(id);
            if (shouldBeVisible !== isVisible) {
                this.updateMarkerVisibility(id, shouldBeVisible);
            }
        }

        // Restore original methods
        if (skipAnimations) {
            this.showMarker = prevShow;
            this.hideMarker = prevHide;
        }
    }

    private processMarkerVisibilityUpdates(
        visibleIds: Set<string>,
        markers: Map<string, google.maps.marker.AdvancedMarkerElement>,
        onComplete?: () => void,
    ) {
        // Process all known ids to avoid sequential reveal side-effects
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

    // Cleanup method
    destroy() {
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

    // --- end viewport helpers ---
}
