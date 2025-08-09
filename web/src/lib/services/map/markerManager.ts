import type {PointListItem} from '$lib/interfaces/object';
import {dragTimeout} from '$lib/stores/map.ts';

export interface MarkerManagerOptions {
    maxVisibleMarkers?: number;
    viewportPadding?: number;
}

export class MarkerManager {
    private map: google.maps.Map | null = null;
    private mapLoader: any = null;
    private options: MarkerManagerOptions;
    private visibleMarkers = new Set<string>();
    private markerCache = new Map<string, google.maps.marker.AdvancedMarkerElement>();

    constructor(options: MarkerManagerOptions = {}) {
        this.options = {
            maxVisibleMarkers: 1000,
            viewportPadding: 0.1,
            ...options,
        };
    }

    async initialize(map: google.maps.Map, mapLoader: any) {
        this.map = map;
        this.mapLoader = mapLoader;
    }

    async createMarker(
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
    ): Promise<google.maps.marker.AdvancedMarkerElement> {
        // Check if marker already exists in cache
        if (this.markerCache.has(id)) {
            return this.markerCache.get(id)!;
        }

        const {AdvancedMarkerElement, CollisionBehavior} =
            await this.mapLoader.importLibrary('marker');

        // Create marker element with proper class list
        const iconElement = document.createElement('div');
        iconElement.style.backgroundColor = options.color;
        iconElement.innerHTML = `<i class="${options.icon}" style="pointer-events:none;"></i>`;
        iconElement.className =
            'w-6 h-6 translate-y-1/2 flex justify-center items-center rounded-full text-sm text-white transition-transform transition-opacity duration-100 ease-in-out animate-popin';

        // Create marker
        const marker = new AdvancedMarkerElement({
            position,
            content: iconElement,
            collisionBehavior: CollisionBehavior.REQUIRED,
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
                            marker.content.classList.add('marker-dragging');
                        }, 500),
                    );
                }
            });
            iconElement.addEventListener('touchstart', () => {
                if (options.onDragStart) {
                    dragTimeout.set(
                        setTimeout(async () => {
                            options.onDragStart!();
                            marker.content.classList.add('marker-dragging');
                        }, 500),
                    );
                }
            });
            iconElement.addEventListener('mouseup', () => {
                if (options.onDragEnd) {
                    dragTimeout.remove();
                    options.onDragEnd();
                    marker.content.classList.remove('marker-dragging');
                }
            });
            iconElement.addEventListener('touchend', () => {
                if (options.onDragEnd) {
                    dragTimeout.remove();
                    options.onDragEnd();
                    marker.content.classList.remove('marker-dragging');
                }
            });
        }

        // Cache the marker
        this.markerCache.set(id, marker);

        // For map-clicked markers, show them immediately
        if (options.source === 'map') {
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
        const marker = this.markerCache.get(id);
        if (!marker) {
            return;
        }

        const markerElement = marker.content as HTMLElement;

        if (isVisible && !this.visibleMarkers.has(id)) {
            markerElement.classList.add('animate-popin');
            this.visibleMarkers.add(id);
            marker.map = this.map;

            setTimeout(() => {
                markerElement.classList.remove('animate-popin');
            }, 200);
        } else if (!isVisible && this.visibleMarkers.has(id)) {
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
    }

    removeMarker(id: string): boolean {
        const marker = this.markerCache.get(id);
        if (!marker) {
            return false;
        }

        // Add removal animation before hiding
        const markerElement = marker.content as HTMLElement;
        if (markerElement) {
            markerElement.classList.add('animate-popout');
            setTimeout(() => {
                marker.map = null;
                this.markerCache.delete(id);
                this.visibleMarkers.delete(id);
                markerElement.classList.remove('animate-popout');
            }, 200);
        } else {
            marker.map = null;
            this.markerCache.delete(id);
            this.visibleMarkers.delete(id);
        }
        return true;
    }

    updateMarkersInViewport(pointList: Record<string, PointListItem>) {
        if (!this.map || !this.map.getBounds()) {
            return;
        }

        const bounds = this.map.getBounds() as google.maps.LatLngBounds;
        const zoom = this.map.getZoom() || 0;
        const maxMarkers = this.options.maxVisibleMarkers!;

        // Group markers into clusters based on proximity
        const clusters = this.groupMarkersIntoClusters(pointList, bounds, zoom);

        // Sort clusters by size (largest first) and distance from center
        const sortedClusters = this.sortClustersByPriority(clusters, bounds);

        // First pass: show all small clusters completely
        const visibleIds = new Set<string>();
        let markerCount = 0;
        const largeClusters: Array<{
            center: google.maps.LatLngLiteral;
            markers: string[];
            size: number;
        }> = [];

        for (const cluster of sortedClusters) {
            if (cluster.size <= 3) {
                if (markerCount + cluster.markers.length > maxMarkers) {
                    break;
                }
                // Add all markers in this cluster
                for (const markerId of cluster.markers) {
                    visibleIds.add(markerId);
                    markerCount++;
                }
            } else {
                // Collect large clusters for second pass
                largeClusters.push(cluster);
            }
        }

        // Second pass: distribute remaining slots among large clusters
        const remainingSlots = maxMarkers - markerCount;
        if (remainingSlots > 0 && largeClusters.length > 0) {
            // Calculate how many markers to show from each large cluster
            const markersPerCluster = Math.floor(remainingSlots / largeClusters.length);
            const extraMarkers = remainingSlots % largeClusters.length;

            for (let i = 0; i < largeClusters.length; i++) {
                const cluster = largeClusters[i];
                const markersToShow = markersPerCluster + (i < extraMarkers ? 1 : 0);

                // Show markers from this cluster
                for (let j = 0; j < Math.min(markersToShow, cluster.markers.length); j++) {
                    visibleIds.add(cluster.markers[j]);
                    markerCount++;
                }
            }
        }

        // Update marker visibility
        for (const id of Object.keys(pointList)) {
            const shouldBeVisible = visibleIds.has(id);
            this.updateMarkerVisibility(id, shouldBeVisible);
        }
    }

    // Method to trigger viewport update from external sources
    triggerViewportUpdate(pointList: Record<string, PointListItem>) {
        this.updateMarkersInViewport(pointList);
    }

    private groupMarkersIntoClusters(
        pointList: Record<string, PointListItem>,
        bounds: google.maps.LatLngBounds,
        zoom: number,
    ): Array<{center: google.maps.LatLngLiteral; markers: string[]; size: number}> {
        const clusters: Array<{
            center: google.maps.LatLngLiteral;
            markers: string[];
            size: number;
        }> = [];
        const clusterRadius = Math.max(0.001, 0.01 / Math.pow(2, zoom - 10)); // Adjust based on zoom level

        // Get all markers in viewport
        const viewportMarkers: Array<{id: string; position: google.maps.LatLngLiteral}> = [];

        for (const [id, point] of Object.entries(pointList)) {
            const position = {
                lat: Number(point.object.lat),
                lng: Number(point.object.lng),
            };

            if (bounds.contains(position)) {
                viewportMarkers.push({id, position});
            }
        }

        // Group markers into clusters
        for (const marker of viewportMarkers) {
            let addedToCluster = false;

            for (const cluster of clusters) {
                const distance = this.calculateDistance(marker.position, cluster.center);
                if (distance <= clusterRadius) {
                    cluster.markers.push(marker.id);
                    cluster.size = cluster.markers.length;
                    // Update cluster center
                    cluster.center = this.calculateClusterCenter(cluster.markers, viewportMarkers);
                    addedToCluster = true;
                    break;
                }
            }

            if (!addedToCluster) {
                clusters.push({
                    center: marker.position,
                    markers: [marker.id],
                    size: 1,
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
    }
}
