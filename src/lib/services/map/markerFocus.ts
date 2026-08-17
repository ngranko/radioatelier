import {focusDetailsTarget} from './map.svelte.ts';
import type {Marker} from './marker';

// Focus can precede marker registration, and viewport culling can recreate its
// DOM, so focused identity must outlive any one rendered element.

const registry = new Map<string, Marker>();
const listeners = new Set<(marker: Marker | undefined) => void>();
let focusedId: string | null = null;
let focusedMarker: Marker | undefined;

export function registerFocusableMarker(targetId: string, marker: Marker) {
    registry.set(targetId, marker);
    if (targetId === focusedId) {
        setFocusedMarker(marker);
        focusMarker(marker);
    }

    return () => {
        if (registry.get(targetId) === marker) {
            registry.delete(targetId);
            if (focusedMarker === marker) {
                setFocusedMarker(undefined);
            }
        }
    };
}

export function setFocusedTarget(targetId: string | null) {
    if (focusedId && focusedId !== targetId) {
        removeHighlight(registry.get(focusedId));
    }
    focusedId = targetId;

    const marker = targetId ? registry.get(targetId) : undefined;
    setFocusedMarker(marker);
    if (marker) {
        focusMarker(marker);
    }
}

export function onFocusedMarkerChange(listener: (marker: Marker | undefined) => void) {
    listeners.add(listener);
    listener(focusedMarker);
    return () => listeners.delete(listener);
}

// The visibility engine creates marker elements lazily, so the highlight is
// re-applied when the focused marker's element finally appears on screen.
export function notifyFocusableMarkerShown(marker: Marker) {
    if (!focusedId || registry.get(focusedId) !== marker) {
        return;
    }
    focusMarker(marker);
}

function focusMarker(marker: Marker) {
    applyHighlight(marker);
    const position = marker.getPosition();
    focusDetailsTarget(position.lat, position.lng);
}

function applyHighlight(marker: Marker) {
    const element = marker.getHandle()?.getElement();
    if (!element) {
        return;
    }

    const targetId = focusedId;
    element.classList.add('duration-100');
    requestAnimationFrame(() => {
        if (!targetId || focusedId !== targetId || registry.get(targetId) !== marker) {
            return;
        }
        element.classList.add('scale-120');
    });
}

function removeHighlight(marker: Marker | undefined) {
    marker?.getHandle()?.getElement()?.classList.remove('scale-120', 'duration-100');
}

function setFocusedMarker(marker: Marker | undefined) {
    if (focusedMarker === marker) {
        return;
    }
    focusedMarker = marker;
    for (const listener of listeners) {
        listener(marker);
    }
}
