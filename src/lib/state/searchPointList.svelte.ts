import type KeyVal from '$lib/interfaces/keyVal';
import type {Location} from '$lib/interfaces/location';
import type {SearchPointListItem} from '$lib/interfaces/object';
import {untrack} from 'svelte';

export const searchPointList = $state<KeyVal<SearchPointListItem>>({});

// Only one point can be previewed at a time, so the key of the previewed one is
// tracked to drop its pin when another point takes over.
let selectedPointKey: string | null = null;

function getSearchPointKey(point: SearchPointListItem) {
    const {id, googlePlaceId, latitude, longitude} = point.object;
    return id ?? googlePlaceId ?? `${latitude},${longitude}`;
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
    if (selectedPointKey === id) {
        selectedPointKey = null;
    }
}

export function selectSearchPoint(point: SearchPointListItem): string {
    const key = getSearchPointKey(point);
    if (selectedPointKey !== key) {
        clearSelectedSearchPoint();
        selectedPointKey = key;
    }

    searchPointList[key] = point;
    return key;
}

export function clearSelectedSearchPoint() {
    if (selectedPointKey) {
        removeSearchPoint(selectedPointKey);
    }
}

// Positions are compared exactly on purpose: every caller gets its coordinates
// from the same search point, either directly or round-tripped through the
// decimal strings of the /point URL, which is lossless.
function isAtPosition(point: SearchPointListItem, position: Location) {
    return point.object.latitude === position.lat && point.object.longitude === position.lng;
}

export function hasSearchPointAt(position: Location) {
    return Object.values(searchPointList).some(point => isAtPosition(point, position));
}

export function removeSearchPointsAt(position: Location) {
    const entries = untrack(() => Object.entries(searchPointList));
    for (const [id, point] of entries) {
        if (isAtPosition(point, position)) {
            removeSearchPoint(id);
        }
    }
}

export function clearSearchPointList() {
    const ids = untrack(() => Object.keys(searchPointList));
    for (const id of ids) {
        delete searchPointList[id];
    }
    selectedPointKey = null;
}
