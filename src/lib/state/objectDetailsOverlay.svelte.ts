import type {LooseObject, Object, PointPreviewDetails} from '$lib/interfaces/object';

export type ObjectDetailsOverlayMode = 'objectView' | 'objectEdit' | 'pointPreview' | 'pointCreate';

interface ObjectDetailsOverlay {
    isOpen: boolean;
    isMinimized: boolean;
    isDirty: boolean;
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
        isDirty: false,
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
    get isDirty() {
        return overlay.isDirty;
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
    Object.assign(overlay, defaultState(), next);
}

export function showLoadingDetailsOverlay(id: string) {
    transition({isOpen: true, isLoading: true, detailsId: id});
}

export function showObjectDetailsOverlay(id: string, initialValues?: Object) {
    transition({
        isOpen: true,
        detailsId: id,
        // Without fresh values the previously shown details stay visible
        // instead of flashing an empty overlay while the query re-runs.
        details: initialValues ?? overlay.details,
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
    transition(options?.preserveDetails ? {details: overlay.details} : {});
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

export function setOverlayDirty(isDirty: boolean) {
    overlay.isDirty = isDirty;
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
