import type {IMapProvider} from '$lib/interfaces/map';
import type {MarkerManager} from '$lib/services/map/markerManager';
import {GoogleMapsProvider} from '$lib/services/map/providers/google/provider';

interface MapState {
    provider: IMapProvider;
    isReady: boolean;
    markerManager?: MarkerManager;
    deckEnabled: boolean;
    streetViewVisible: boolean;
}

export const mapState = $state<MapState>({
    provider: new GoogleMapsProvider(),
    isReady: false,
    markerManager: undefined,
    deckEnabled: false,
    streetViewVisible: false,
});

export function getGoogleProvider(): GoogleMapsProvider {
    if (!(mapState.provider instanceof GoogleMapsProvider)) {
        throw new Error('Expected GoogleMapsProvider');
    }
    return mapState.provider;
}
