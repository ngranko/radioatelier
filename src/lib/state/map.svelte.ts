import type {IMapProvider} from '$lib/interfaces/map';
import type {MarkerManager} from '$lib/services/map/markerManager';

interface MapState {
    provider: IMapProvider | null;
    isReady: boolean;
    markerManager?: MarkerManager;
    deckEnabled: boolean;
    streetViewVisible: boolean;
}

export const mapState = $state<MapState>({
    provider: null,
    isReady: false,
    markerManager: undefined,
    deckEnabled: false,
    streetViewVisible: false,
});
