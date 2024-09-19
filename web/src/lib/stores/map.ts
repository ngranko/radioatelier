import {readable, writable} from 'svelte/store';
import {Loader} from '@googlemaps/js-api-loader';
import type {MarkerListItem, ObjectDetailsInfo} from '$lib/interfaces/object';
import config from '$lib/config';
import type KeyVal from '$lib/interfaces/keyVal';

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

const privateMarkerList = writable<KeyVal<MarkerListItem>>({});

export const markerList = {
    subscribe: privateMarkerList.subscribe,
    set: (value: MarkerListItem[]) => {
        privateMarkerList.update(oldValue => {
            if (!Object.keys(oldValue).length) {
                const result: KeyVal<MarkerListItem> = {};
                for (const object of value) {
                    result[object.id] = object;
                }

                return result;
            }
            return oldValue;
        });
    },
    addMarker: (marker: MarkerListItem) => {
        privateMarkerList.update(value => {
            return {...value, [marker.id]: marker};
        });
    },
    removeMarker: (id: string) => {
        privateMarkerList.update(value => {
            delete value[id];
            return value;
        });
    },
    updateMarker: (id: string, updatedFields: Partial<MarkerListItem>) => {
        privateMarkerList.update(value => {
            const marker = value[id];
            if (marker) {
                if (updatedFields.lat) {
                    marker.lat = updatedFields.lat;
                }
                if (updatedFields.lng) {
                    marker.lng = updatedFields.lng;
                }
                if (updatedFields.isVisited) {
                    marker.isVisited = updatedFields.isVisited;
                }
                if (updatedFields.isRemoved) {
                    marker.isRemoved = updatedFields.isRemoved;
                }
                if (updatedFields.marker) {
                    if (marker.marker) {
                        marker.marker.map = null;
                    }
                    marker.marker = updatedFields.marker;
                }
            }
            return value;
        });
    },
};
