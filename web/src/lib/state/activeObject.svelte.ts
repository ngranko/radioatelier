import type {BareObject, Object} from '$lib/interfaces/object.ts';

interface ActiveObject {
    isMinimized: boolean;
    isEditing: boolean;
    isDirty: boolean;
    detailsId: string;
    object: Object | BareObject | null;
}

export const activeObject = $state<ActiveObject>({
    isMinimized: false,
    isEditing: false,
    isDirty: false,
    detailsId: '',
    object: null,
});

export function resetActiveObject() {
    activeObject.isMinimized = false;
    activeObject.isDirty = false;
    activeObject.isEditing = false;
    activeObject.detailsId = '';
    activeObject.object = null;
}
