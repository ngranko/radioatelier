import type {LooseObject, Object} from '$lib/interfaces/object';

interface ObjectDetailsOverlay {
    isOpen: boolean;
    isMinimized: boolean;
    isEditing: boolean;
    isDirty: boolean;
    isLoading: boolean;
    isAddressLoading: boolean;
    detailsId: string;
    details?: Partial<LooseObject>;
}

export const objectDetailsOverlay = $state<ObjectDetailsOverlay>({
    isOpen: false,
    isMinimized: false,
    isEditing: false,
    isDirty: false,
    isLoading: false,
    isAddressLoading: false,
    detailsId: '',
    details: undefined,
});

export function showLoadingDetailsOverlay(id: string) {
    objectDetailsOverlay.isOpen = true;
    objectDetailsOverlay.isLoading = true;
    objectDetailsOverlay.isMinimized = false;
    objectDetailsOverlay.isEditing = false;
    objectDetailsOverlay.isDirty = false;
    objectDetailsOverlay.isLoading = true;
    objectDetailsOverlay.isAddressLoading = false;
    objectDetailsOverlay.detailsId = id;
    objectDetailsOverlay.details = undefined;
}

export function showObjectDetailsOverlay(id: string, initialValues?: Object) {
    objectDetailsOverlay.isOpen = true;
    objectDetailsOverlay.isMinimized = false;
    objectDetailsOverlay.isDirty = false;
    objectDetailsOverlay.isEditing = false;
    objectDetailsOverlay.isLoading = false;
    objectDetailsOverlay.isAddressLoading = false;
    objectDetailsOverlay.detailsId = id;
    if (initialValues) {
        objectDetailsOverlay.details = initialValues;
    }
}

export function showCreateDetailsOverlay(id: string, initialValues: Partial<LooseObject>) {
    objectDetailsOverlay.isOpen = true;
    objectDetailsOverlay.isMinimized = false;
    objectDetailsOverlay.isEditing = true;
    objectDetailsOverlay.isDirty = false;
    objectDetailsOverlay.isLoading = false;
    objectDetailsOverlay.isAddressLoading = true;
    objectDetailsOverlay.detailsId = id;
    objectDetailsOverlay.details = initialValues;
}

export function closeDetailsOverlay() {
    objectDetailsOverlay.isOpen = false;
    objectDetailsOverlay.isMinimized = false;
    objectDetailsOverlay.isEditing = false;
    objectDetailsOverlay.isDirty = false;
    objectDetailsOverlay.isLoading = false;
    objectDetailsOverlay.isAddressLoading = false;
    objectDetailsOverlay.detailsId = '';
    objectDetailsOverlay.details = undefined;
}
