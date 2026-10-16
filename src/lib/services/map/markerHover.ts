import type {Marker} from './marker';

// A class of its own rather than the focus highlight's scale-120, so a hover
// ending never shrinks the pin whose details are open.
const HOVER_CLASS = 'marker-hovered';
// Pins sharing a z-index stack by latitude, so a raised one is not left
// scaled up underneath its southern neighbour.
const RAISED_Z_INDEX = 2;

let hovered: Marker | undefined;

export function pointAtMarker(marker: Marker | undefined) {
    if (marker === hovered) {
        return;
    }
    applyHover(hovered, false);
    hovered = marker;
    applyHover(marker, true);
}

/** A leave that arrives after another row took over must not clear that row's pin. */
export function stopPointingAtMarker(marker: Marker | undefined) {
    if (marker && marker === hovered) {
        pointAtMarker(undefined);
    }
}

function applyHover(marker: Marker | undefined, isHovered: boolean) {
    const handle = marker?.getHandle();
    if (!marker || !handle) {
        return;
    }
    handle.getElement()?.classList.toggle(HOVER_CLASS, isHovered);
    handle.setZIndex(isHovered ? RAISED_Z_INDEX : marker.getZIndex());
}
