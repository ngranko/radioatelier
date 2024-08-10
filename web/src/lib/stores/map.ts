import {readable, writable} from 'svelte/store';
import {Loader} from '@googlemaps/js-api-loader';
import type {ObjectDetailsInfo} from '$lib/interfaces/object';
import config from '$lib/config';

export const mapLoader = readable<Loader>(undefined, function start(set) {
    set(
        new Loader({
            apiKey: config.googleMapsApiKey,
            version: 'weekly',
            libraries: ['places', 'marker'],
        }),
    );
});

export const map = writable<google.maps.Map>(undefined);

const {subscribe, set, update} = writable<ObjectDetailsInfo>({
    isLoading: false,
    isEditing: false,
    detailsId: '',
    object: null,
});

export const activeObjectInfo = {
    subscribe,
    reset: () => set({isLoading: false, isEditing: false, detailsId: '', object: null}),
    set,
    update,
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

const privateDragTimeout = writable<number | null>(null);

export const dragTimeout = {
    subscribe: privateDragTimeout.subscribe,
    set: (timeout: number) => {
        privateDragTimeout.update(value => {
            if (value) {
                clearTimeout(value);
            }
            return timeout;
        });
    },
    remove: () =>
        privateDragTimeout.update(value => {
            if (value) {
                clearTimeout(value);
            }
            return null;
        }),
};
