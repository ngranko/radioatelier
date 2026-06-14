import type {LooseObject, Object, PointPreviewDetails} from '$lib/interfaces/object';
import {untrack} from 'svelte';

export type ObjectDetailsOverlayMode = 'objectView' | 'objectEdit' | 'pointPreview' | 'pointCreate';

interface ObjectDetailsOverlay {
    isOpen: boolean;
    isMinimized: boolean;
    isLoading: boolean;
    isAddressLoading: boolean;
    detailsId: string;
    mode: ObjectDetailsOverlayMode;
    details?: Partial<LooseObject>;
    pointDetails?: PointPreviewDetails;
}

function defaultState(): ObjectDetailsOverlay {
    return {
        isOpen: false,
        isMinimized: false,
        isLoading: false,
        isAddressLoading: false,
        detailsId: '',
        mode: 'objectView',
        details: undefined,
        pointDetails: undefined,
    };
}

const overlay = $state<ObjectDetailsOverlay>(defaultState());

// Read-only view of the overlay state: every legal write goes through the
// transition functions below, so the set of reachable states stays enumerable.
export const objectDetailsOverlay = {
    get isOpen() {
        return overlay.isOpen;
    },
    get isMinimized() {
        return overlay.isMinimized;
    },
    get isLoading() {
        return overlay.isLoading;
    },
    get isAddressLoading() {
        return overlay.isAddressLoading;
    },
    get detailsId() {
        return overlay.detailsId;
    },
    get mode() {
        return overlay.mode;
    },
    get details() {
        return overlay.details;
    },
    get pointDetails() {
        return overlay.pointDetails;
    },
};

function transition(next: Partial<ObjectDetailsOverlay>) {
    const nextState = {...defaultState(), ...next};

    overlay.isOpen = nextState.isOpen;
    overlay.isMinimized = nextState.isMinimized;
    overlay.isLoading = nextState.isLoading;
    overlay.isAddressLoading = nextState.isAddressLoading;
    overlay.detailsId = nextState.detailsId;
    overlay.mode = nextState.mode;
    overlay.details = nextState.details;
    overlay.pointDetails = nextState.pointDetails;
}

export function showLoadingDetailsOverlay(id: string) {
    transition({isOpen: true, isLoading: true, detailsId: id});
}

export function showObjectDetailsOverlay(id: string, initialValues?: Object) {
    const current = untrack(() => ({
        details: overlay.details,
        isAddressLoading: overlay.isAddressLoading,
        isMinimized: overlay.isMinimized,
        isOpen: overlay.isOpen,
        mode: overlay.mode,
    }));

    transition({
        isOpen: true,
        detailsId: id,
        mode: current.isOpen ? current.mode : 'objectView',
        isMinimized: current.isOpen ? current.isMinimized : false,
        isAddressLoading: current.isOpen ? current.isAddressLoading : false,
        // Without fresh values the previously shown details stay visible
        // instead of flashing an empty overlay while the query re-runs.
        details: initialValues ?? current.details,
    });
}

export function showPointPreviewOverlay(
    id: string,
    initialValues: Partial<LooseObject>,
    pointDetails: PointPreviewDetails,
) {
    transition({
        isOpen: true,
        detailsId: id,
        mode: 'pointPreview',
        details: initialValues,
        pointDetails,
    });
}

export function showPointCreateOverlay(
    id: string,
    initialValues: Partial<LooseObject>,
    pointDetails?: PointPreviewDetails,
) {
    transition({
        isOpen: true,
        detailsId: id,
        mode: 'pointCreate',
        details: initialValues,
        pointDetails,
    });
}

export function closeDetailsOverlay(options?: {preserveDetails?: boolean}) {
    const details = options?.preserveDetails ? untrack(() => overlay.details) : undefined;

    transition(options?.preserveDetails ? {details} : {});
}

export function enterEditMode() {
    overlay.mode = 'objectEdit';
}

export function returnToViewMode() {
    overlay.mode = 'objectView';
}

export function returnToPointPreview() {
    overlay.mode = 'pointPreview';
}

export function setOverlayMinimized(isMinimized: boolean) {
    overlay.isMinimized = isMinimized;
}

export function refreshOverlayDetails(details: Partial<LooseObject>) {
    overlay.details = details;
}

export function setOverlayAddressLoading(isLoading: boolean) {
    overlay.isAddressLoading = isLoading;
}
