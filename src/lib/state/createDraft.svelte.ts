import type {LooseObject} from '$lib/interfaces/object';

export const createDraftState = $state<{
    position: {lat: number; lng: number} | null;
    initialValues: Partial<LooseObject> | null;
}>({
    position: null,
    initialValues: null,
});

export function setCreateDraftPosition(position: {lat: number; lng: number} | null) {
    createDraftState.position = position;
}

export function setCreateDraftInitialValues(values: Partial<LooseObject> | null) {
    createDraftState.initialValues = values;
}
