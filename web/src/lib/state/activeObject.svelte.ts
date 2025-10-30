import type {BareObject, Object} from '$lib/interfaces/object.ts';

interface ActiveObject {
    isMinimized: boolean;
    isLoading: boolean;
    isEditing: boolean;
    isDirty: boolean;
    detailsId: string;
    object: Object | BareObject | null;
}

export const activeObject = $state<ActiveObject>({
    isMinimized: false,
    isLoading: false,
    isEditing: false,
    isDirty: false,
    detailsId: '',
    object: null,
});

export function resetActiveObject() {
    activeObject.isMinimized = false;
    activeObject.isLoading = false;
    activeObject.isEditing = false;
    activeObject.isDirty = false;
    activeObject.detailsId = '';
    activeObject.object = null;
}
