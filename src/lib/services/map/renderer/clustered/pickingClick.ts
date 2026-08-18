export interface ClusteredPickingInfo<T> {
    object?: T | null;
}

export interface ClusteredPickingEvent {
    stopPropagation?: () => void;
    srcEvent?: {stop?: () => void};
}

export function handleClusteredPickingClick<T>(
    info: ClusteredPickingInfo<T>,
    event: ClusteredPickingEvent,
    onPick: (object: T) => void,
): boolean {
    if (!info.object) {
        return false;
    }
    onPick(info.object);
    // GoogleMapsOverlay forwards a mock event without Mjolnir methods.
    event.srcEvent?.stop?.();
    event.stopPropagation?.();
    return true;
}
