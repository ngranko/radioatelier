import type {MapProvider} from '$lib/interfaces/map';
import type {MarkerManager} from '$lib/services/map/markerManager';

interface MapState {
    provider: MapProvider | null;
    isReady: boolean;
    markerManager?: MarkerManager;
    streetViewVisible: boolean;
}

export const mapState = $state<MapState>({
    provider: null,
    isReady: false,
    markerManager: undefined,
    streetViewVisible: false,
});
