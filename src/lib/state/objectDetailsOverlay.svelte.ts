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

export const objectDetailsOverlay = $state<ObjectDetailsOverlay>({
    isOpen: false,
    isMinimized: false,
    isDirty: false,
    isLoading: false,
    isAddressLoading: false,
    detailsId: '',
    mode: 'objectView',
    details: undefined,
    pointDetails: undefined,
});

export function showLoadingDetailsOverlay(id: string) {
    objectDetailsOverlay.isOpen = true;
    objectDetailsOverlay.isLoading = true;
    objectDetailsOverlay.isMinimized = false;
    objectDetailsOverlay.isDirty = false;
    objectDetailsOverlay.isLoading = true;
    objectDetailsOverlay.isAddressLoading = false;
    objectDetailsOverlay.detailsId = id;
    objectDetailsOverlay.mode = 'objectView';
    objectDetailsOverlay.details = undefined;
    objectDetailsOverlay.pointDetails = undefined;
}

export function showObjectDetailsOverlay(id: string, initialValues?: Object) {
    objectDetailsOverlay.isOpen = true;
    objectDetailsOverlay.isMinimized = false;
    objectDetailsOverlay.isDirty = false;
    objectDetailsOverlay.isLoading = false;
    objectDetailsOverlay.isAddressLoading = false;
    objectDetailsOverlay.detailsId = id;
    objectDetailsOverlay.mode = 'objectView';
    if (initialValues) {
        objectDetailsOverlay.details = initialValues;
    }
    objectDetailsOverlay.pointDetails = undefined;
}

export function showPointPreviewOverlay(
    id: string,
    initialValues: Partial<LooseObject>,
    pointDetails: PointPreviewDetails,
) {
    objectDetailsOverlay.isOpen = true;
    objectDetailsOverlay.isMinimized = false;
    objectDetailsOverlay.isDirty = false;
    objectDetailsOverlay.isLoading = false;
    objectDetailsOverlay.isAddressLoading = false;
    objectDetailsOverlay.detailsId = id;
    objectDetailsOverlay.mode = 'pointPreview';
    objectDetailsOverlay.details = initialValues;
    objectDetailsOverlay.pointDetails = pointDetails;
}

export function showPointCreateOverlay(
    id: string,
    initialValues: Partial<LooseObject>,
    pointDetails?: PointPreviewDetails,
) {
    objectDetailsOverlay.isOpen = true;
    objectDetailsOverlay.isMinimized = false;
    objectDetailsOverlay.isDirty = false;
    objectDetailsOverlay.isLoading = false;
    objectDetailsOverlay.isAddressLoading = false;
    objectDetailsOverlay.detailsId = id;
    objectDetailsOverlay.mode = 'pointCreate';
    objectDetailsOverlay.details = initialValues;
    objectDetailsOverlay.pointDetails = pointDetails;
}

export function closeDetailsOverlay() {
    objectDetailsOverlay.isOpen = false;
    objectDetailsOverlay.isMinimized = false;
    objectDetailsOverlay.isDirty = false;
    objectDetailsOverlay.isLoading = false;
    objectDetailsOverlay.isAddressLoading = false;
    objectDetailsOverlay.detailsId = '';
    objectDetailsOverlay.mode = 'objectView';
    objectDetailsOverlay.details = undefined;
    objectDetailsOverlay.pointDetails = undefined;
}
