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
    const element = marker?.getHandle()?.getElement();
    if (!element) {
        return;
    }

    element.classList.remove('scale-120');
    element.classList.remove('duration-100');
}

export function activateMarker(marker: Marker | null = activeMarker.marker) {
    const element = marker?.getHandle()?.getElement();
    if (!element) {
        return;
    }

    element.classList.add('duration-100');
    requestAnimationFrame(() => {
        element.classList.add('scale-120');
    });
}
