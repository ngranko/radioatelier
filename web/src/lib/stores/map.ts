import type KeyVal from '$lib/interfaces/keyVal';
import type {PointListItem, SearchPointListItem} from '$lib/interfaces/object';
import type {Marker} from '$lib/services/map/marker';
import {writable} from 'svelte/store';

const privateActiveMarker = writable<Marker | null>(null);

export const activeMarker = {
    subscribe: privateActiveMarker.subscribe,
    set: privateActiveMarker.set,
    deactivate: () =>
        privateActiveMarker.update(value => {
            if (value && value.getRaw()) {
                (value.getRaw()!.content as HTMLElement).classList.remove('scale-120');
                (value.getRaw()!.content as HTMLElement).classList.remove('duration-100');
            }
            return value;
        }),
    activate: () =>
        privateActiveMarker.update(value => {
            if (value && value.getRaw()) {
                (value.getRaw()!.content as HTMLElement).classList.add('duration-100');
                requestAnimationFrame(() => {
                    (value.getRaw()!.content as HTMLElement).classList.add('scale-120');
                });
            }
            return value;
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
            if (point && updatedFields.object) {
                point.object = updatedFields.object;
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
            if (point && updatedFields.object) {
                point.object = updatedFields.object;
            }
            return value;
        });
    },
    clear: () => {
        privateSearchPointList.set({});
    },
};
