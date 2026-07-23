import type {MarkerId} from '$lib/interfaces/marker';
import {focusDetailsTarget} from './map.svelte.ts';
import type {Marker} from './marker';

// The single owner of "which marker is focused": highlight, map centering,
// and the registry that lets a marker appear after focus was already set
// (share pages, viewport culling, renderer switches). Markers register under
// the id the details overlay would show for them; the overlay's detailsId is
// bridged into setFocusedTarget by a single effect in map.svelte.

const registry = new Map<string, Marker>();
let focusedId: string | null = null;

export function registerFocusableMarker(targetId: string, marker: Marker) {
    registry.set(targetId, marker);
    if (targetId === focusedId) {
        focusMarker(marker);
    }
}

export function unregisterFocusableMarker(targetId: string, marker: Marker) {
    if (registry.get(targetId) === marker) {
        registry.delete(targetId);
    }
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
export function notifyFocusableMarkerShown(id: MarkerId, marker: Marker) {
    if (id !== focusedId) {
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

    element.classList.add('duration-100');
    requestAnimationFrame(() => {
        element.classList.add('scale-120');
    });
}

function removeHighlight(marker: Marker | undefined) {
    const element = marker?.getHandle()?.getElement();
    if (!element) {
        return;
    }

    element.classList.remove('scale-120');
    element.classList.remove('duration-100');
}
