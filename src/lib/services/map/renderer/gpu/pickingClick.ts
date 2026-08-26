export interface SpritePickingInfo<T> {
    object?: T | null;
}

export interface SpritePickingEvent {
    stopPropagation?: () => void;
    // Deck.gl's native Event has no `stop`; GoogleMapsOverlay mocks one instead.
    srcEvent?: Event | {stop?: () => void} | null;
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
    stopOverlayClick(event.srcEvent);
    event.stopPropagation?.();
    return true;
}

function stopOverlayClick(srcEvent: SpritePickingEvent['srcEvent']) {
    if (srcEvent && 'stop' in srcEvent) {
        srcEvent.stop?.();
    }
}
