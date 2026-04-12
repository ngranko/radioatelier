import type KeyVal from '$lib/interfaces/keyVal';
import type {SearchPointListItem} from '$lib/interfaces/object';
import {untrack} from 'svelte';

export const searchPointList = $state<KeyVal<SearchPointListItem>>({});

function getSearchPointKey(point: SearchPointListItem) {
    return point.object.id ?? point.object.googlePlaceId ?? window.crypto.randomUUID();
}

export function replaceSearchPointList(points: SearchPointListItem[]) {
    const nextPoints: KeyVal<SearchPointListItem> = {};
    for (const point of points) {
        nextPoints[getSearchPointKey(point)] = point;
    }

    clearSearchPointList();
    Object.assign(searchPointList, nextPoints);
}

export function removeSearchPoint(id: string) {
    delete searchPointList[id];
}

export function updateSearchPoint(id: string, updatedFields: Partial<SearchPointListItem>) {
    const point = searchPointList[id];
    if (!point) {
        return;
    }

    searchPointList[id] = {...point, ...updatedFields};
}

export function upsertSearchPoint(id: string, point: SearchPointListItem) {
    searchPointList[id] = point;
}

export function clearSearchPointList() {
    const ids = untrack(() => Object.keys(searchPointList));
    for (const id of ids) {
        delete searchPointList[id];
    }
}
