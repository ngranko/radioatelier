export interface SpritePickingInfo<T> {
    object?: T | null;
}

export interface SpritePickingEvent {
    stopPropagation?: () => void;
    srcEvent?: {stop?: () => void};
}

export function handleSpritePickingClick<T>(
    info: SpritePickingInfo<T>,
    event: SpritePickingEvent,
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
