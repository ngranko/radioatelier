import {focusDetailsTarget} from './map.svelte.ts';
import type {Marker} from './marker';

// Focus can precede marker registration, and viewport culling can recreate its
// DOM, so focused identity must outlive any one rendered element.

const registry = new Map<string, Marker>();
let focusedId: string | null = null;

export function registerFocusableMarker(targetId: string, marker: Marker) {
    registry.set(targetId, marker);
    if (targetId === focusedId) {
        focusMarker(marker);
    }

    return () => {
        if (registry.get(targetId) === marker) {
            registry.delete(targetId);
        }
    };
}

export function setFocusedTarget(targetId: string | null) {
    if (focusedId && focusedId !== targetId) {
        removeHighlight(registry.get(focusedId));
    }
    focusedId = targetId;

    const marker = targetId ? registry.get(targetId) : undefined;
    if (marker) {
        focusMarker(marker);
    }
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
