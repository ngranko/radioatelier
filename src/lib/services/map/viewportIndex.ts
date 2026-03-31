import type {LatLngLiteral, MapBounds} from '$lib/interfaces/map';
import type {MarkerId} from '$lib/interfaces/marker';
import type {MarkerRepository} from '$lib/services/map/markerRepository';

export interface ViewportCandidate {
    id: MarkerId;
    position: LatLngLiteral;
}

export class ViewportIndex {
    public collect(bounds: MapBounds, repo: MarkerRepository): ViewportCandidate[] {
        const allMarkersInViewport: ViewportCandidate[] = [];

        for (const id of repo.ids()) {
            const markerData = repo.get(id);
            if (markerData && bounds.contains(markerData.getPosition())) {
                allMarkersInViewport.push({id, position: markerData.getPosition()});
            }
        }

        return allMarkersInViewport;
    }

    public selectVisible(
        candidates: ViewportCandidate[],
        center: LatLngLiteral,
        limit: number,
    ): Set<string> {
        const sorted = this.sortByDistance(candidates, center);
        return this.pickVisibleIds(sorted, limit);
    }

    private sortByDistance(
        markers: ViewportCandidate[],
        center: LatLngLiteral,
    ): ViewportCandidate[] {
        return markers.sort((a, b) => {
            const distanceA = this.calculateDistance(a.position, center);
            const distanceB = this.calculateDistance(b.position, center);
            return distanceA - distanceB;
        });
    }

    private pickVisibleIds(
        sortedMarkers: ViewportCandidate[],
        maxVisibleMarkers: number,
    ): Set<string> {
        const visibleIds = new Set<string>();
        for (let i = 0; i < Math.min(sortedMarkers.length, maxVisibleMarkers); i++) {
            visibleIds.add(sortedMarkers[i].id);
        }
        return visibleIds;
    }

    private calculateDistance(pos1: LatLngLiteral, pos2: LatLngLiteral): number {
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
