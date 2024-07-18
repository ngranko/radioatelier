import {readable, writable} from 'svelte/store';
import {Loader} from '@googlemaps/js-api-loader';
import type {ObjectDetailsInfo} from '$lib/interfaces/object';

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

const {subscribe, set} = writable<ObjectDetailsInfo>({isLoading: false, object: null});

export const activeObjectInfo = {
    subscribe,
    reset: () => set({isLoading: false, object: null}),
    set,
};

const privateActiveMarker = writable<google.maps.marker.AdvancedMarkerElement | null>(null);

export const activeMarker = {
    subscribe: privateActiveMarker.subscribe,
    set: privateActiveMarker.set,
    deactivate: () =>
        privateActiveMarker.update(value => {
            if (value) {
                (value.content as HTMLElement).classList.remove('map-marker-active');
            }
            return value;
        }),
    activate: () =>
        privateActiveMarker.update(value => {
            if (value) {
                (value.content as HTMLElement).classList.add('map-marker-active');
            }
            return value;
        }),
};
