import config from '$lib/config';
import type KeyVal from '$lib/interfaces/keyVal';
import type {ObjectDetailsInfo, PointListItem, SearchPointListItem} from '$lib/interfaces/object';
import {Loader} from '@googlemaps/js-api-loader';
import {readable, writable} from 'svelte/store';

export const mapLoader = readable<Loader>(undefined, function start(set) {
    set(
        new Loader({
            apiKey: config.googleMapsApiKey,
            version: 'weekly',
            libraries: ['places', 'marker'],
        }),
    );
});

export const map = writable<google.maps.Map | undefined>(undefined);

const {subscribe, set, update} = writable<ObjectDetailsInfo>({
    isMinimized: false,
    isLoading: false,
    isEditing: false,
    isDirty: false,
    detailsId: '',
    object: null,
});

export const activeObjectInfo = {
    subscribe,
    reset: () =>
        set({
            isMinimized: false,
            isLoading: false,
            isEditing: false,
            isDirty: false,
            detailsId: '',
            object: null,
        }),
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

const privatePointList = writable<KeyVal<PointListItem>>({});

export const pointList = {
    subscribe: privatePointList.subscribe,
    set: (value: PointListItem[]) => {
        privatePointList.update(() => {
            const result: KeyVal<PointListItem> = {};
            for (const point of value) {
                result[point.object.id] = point;
            }

            return result;
        });
    },
    add: (point: PointListItem) => {
        privatePointList.update(value => {
            return {...value, [point.object.id]: point};
        });
    },
    remove: (id: string) => {
        privatePointList.update(value => {
            delete value[id];
            return value;
        });
    },
    update: (id: string, updatedFields: Partial<PointListItem>) => {
        privatePointList.update(value => {
            const point = value[id];
            if (point) {
                if (updatedFields.object) {
                    point.object = updatedFields.object;
                }
                if (updatedFields.marker) {
                    if (point.marker) {
                        point.marker.map = null;
                    }
                    point.marker = updatedFields.marker;
                }
            }
            return value;
        });
    },
    updateCoordinates: (id: string, lat: string, lng: string) => {
        privatePointList.update(value => {
            const point = value[id];
            if (point) {
                point.object.lat = lat;
                point.object.lng = lng;
            }
            return value;
        });
    },
    clear: () => {
        privatePointList.set({});
    },
};

const privateSearchPointList = writable<KeyVal<SearchPointListItem>>({});

export const searchPointList = {
    subscribe: privateSearchPointList.subscribe,
    set: (value: SearchPointListItem[]) => {
        privateSearchPointList.update(() => {
            const result: KeyVal<SearchPointListItem> = {};
            for (const point of value) {
                result[point.object.id ?? window.crypto.randomUUID()] = point;
            }

            return result;
        });
    },
    remove: (id: string) => {
        privateSearchPointList.update(value => {
            delete value[id];
            return value;
        });
    },
    update: (id: string, updatedFields: Partial<SearchPointListItem>) => {
        privateSearchPointList.update(value => {
            const point = value[id];
            if (point) {
                if (updatedFields.object) {
                    point.object = updatedFields.object;
                }
                if (updatedFields.marker) {
                    privatePointList.update(value => {
                        if (value[id] && value[id].marker) {
                            value[id].marker.map = null;
                        }
                        return value;
                    });
                    if (point.marker) {
                        point.marker.map = null;
                    }
                    point.marker = updatedFields.marker;
                }
            }
            return value;
        });
    },
    clear: () => {
        privateSearchPointList.update(searchPoints => {
            for (const id in searchPoints) {
                privatePointList.update(points => {
                    if (points[id] && points[id].marker && searchPoints[id].marker) {
                        points[id].marker.map = searchPoints[id].marker.map;
                    }
                    return points;
                });
            }
            return {};
        });
    },
};
