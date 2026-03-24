import type {Marker} from '$lib/services/map/marker';

interface ActiveMarkerState {
    marker: Marker | null;
}

export const activeMarker = $state<ActiveMarkerState>({
    marker: null,
});

export function setActiveMarker(marker: Marker | null) {
    activeMarker.marker = marker;
}

export function clearActiveMarker() {
    activeMarker.marker = null;
}

export function deactivateActiveMarker() {
    const markerElement = getActiveMarkerElement();
    if (!markerElement) {
        return;
    }

    markerElement.classList.remove('scale-120');
    markerElement.classList.remove('duration-100');
}

export function activateActiveMarker() {
    const markerElement = getActiveMarkerElement();
    if (!markerElement) {
        return;
    }

    markerElement.classList.add('duration-100');
    requestAnimationFrame(() => {
        markerElement.classList.add('scale-120');
    });
}

function getActiveMarkerElement() {
    const rawMarker = activeMarker.marker?.getRaw();
    if (!rawMarker) {
        return null;
    }

    return rawMarker.content instanceof HTMLElement ? rawMarker.content : null;
}
