interface MarkerState {
    dragTimeout?: number;
}

export const markerState = $state<MarkerState>({
    dragTimeout: undefined,
});

export function setDragTimeout(timeoutId: number) {
    if (markerState.dragTimeout) {
        clearTimeout(markerState.dragTimeout);
    }
    markerState.dragTimeout = timeoutId;
}

export function removeDragTimeout() {
    if (markerState.dragTimeout) {
        clearTimeout(markerState.dragTimeout);
    }
    markerState.dragTimeout = undefined;
}
