import type {Object} from '$lib/interfaces/object.ts';

interface SharedMarker {
    object?: Object;
}

export const sharedMarker = $state<SharedMarker>({});
