interface MarkerState {
    dragTimeout: number | undefined;
}

export const markerState = $state<MarkerState>({
    dragTimeout: undefined,
});

export function setDragTimeout(timeout: number) {
    if (markerState.dragTimeout) {
        clearTimeout(markerState.dragTimeout);
    }
    markerState.dragTimeout = timeout;
}

export function removeDragTimeout() {
    if (markerState.dragTimeout) {
        clearTimeout(markerState.dragTimeout);
    }
    markerState.dragTimeout = undefined;
}