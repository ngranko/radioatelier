import type {BareObject, Object} from '$lib/interfaces/object.ts';

interface ActiveObject {
    isMinimized: boolean;
    isEditing: boolean;
    isDirty: boolean;
    isLoading: boolean;
    addressLoading: boolean;
    detailsId: string;
    object: Object | BareObject | null;
}

export const activeObject = $state<ActiveObject>({
    isMinimized: false,
    isEditing: false,
    isDirty: false,
    isLoading: false,
    addressLoading: false,
    detailsId: '',
    object: null,
});

export function resetActiveObject() {
    activeObject.isMinimized = false;
    activeObject.isDirty = false;
    activeObject.isEditing = false;
    activeObject.isLoading = false;
    activeObject.addressLoading = false;
    activeObject.detailsId = '';
    activeObject.object = null;
}
