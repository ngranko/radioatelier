import {readable, writable} from 'svelte/store';
import {Loader} from '@googlemaps/js-api-loader';
import type {BareObject, Object, ObjectDetailsInfo} from '$lib/interfaces/object';

export const mapLoader = readable<Loader>(undefined, function start(set) {
    set(
        new Loader({
            apiKey: 'AIzaSyDLWuVdej-R0l4O-aabmUVOyfcMA6gtWh4',
            version: 'weekly',
            libraries: ['places', 'marker'],
        }),
    );
});

export const map = writable<google.maps.Map>(undefined);

const {subscribe, set, update} = writable<ObjectDetailsInfo>({isLoading: false, object: null});

export const activeObjectInfo = {
    subscribe,
    reset: () => set({isLoading: false, object: null}),
    set,
};

export const activeMarker = writable<google.maps.marker.AdvancedMarkerElement | null>(null);
