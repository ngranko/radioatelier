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

export function deactivateMarker(marker: Marker | null = activeMarker.marker) {
    const markerElement = getMarkerElement(marker);
    if (!markerElement) {
        return;
    }

    markerElement.classList.remove('scale-120');
    markerElement.classList.remove('duration-100');
}

export function activateMarker(marker: Marker | null = activeMarker.marker) {
    const markerElement = getMarkerElement(marker);
    if (!markerElement) {
        return;
    }

    markerElement.classList.add('duration-100');
    requestAnimationFrame(() => {
        markerElement.classList.add('scale-120');
    });
}

function getMarkerElement(marker: Marker | null) {
    const rawMarker = marker?.getRaw();
    if (!rawMarker) {
        return null;
    }

    return rawMarker.content instanceof HTMLElement ? rawMarker.content : null;
}
