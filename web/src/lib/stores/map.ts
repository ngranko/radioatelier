import {readable, writable} from 'svelte/store';
import {Loader} from '@googlemaps/js-api-loader';

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
