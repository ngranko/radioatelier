export const createDraftState = $state<{
    position: {lat: number; lng: number} | null;
}>({
    position: null,
});

export function setCreateDraftPosition(position: {lat: number; lng: number} | null) {
    createDraftState.position = position;
}
