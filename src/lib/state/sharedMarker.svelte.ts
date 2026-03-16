import type {Object} from '$lib/interfaces/object.ts';

interface SharedMarker {
    object?: Object;
}

export const sharedMarker = $state<SharedMarker>({});

export function setSharedMarkerObject(object: Object) {
    sharedMarker.object = object;
}

export function clearSharedMarker() {
    sharedMarker.object = undefined;
}
