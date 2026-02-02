import config from '$lib/config';
import type {MarkerManager} from '$lib/services/map/markerManager';
import {Loader} from '@googlemaps/js-api-loader';

interface MapState {
    loader: Loader;
    map?: google.maps.Map;
    markerManager?: MarkerManager;
    deckEnabled: boolean;
}

export const mapState = $state<MapState>({
    loader: new Loader({
        apiKey: config.googleMapsApiKey,
        version: 'weekly',
        libraries: ['places', 'marker'],
    }),
    map: undefined,
    markerManager: undefined,
    deckEnabled: false,
});
