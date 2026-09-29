import type {Marker} from './marker';

// A class of its own rather than the focus highlight's scale-120, so a hover
// ending never shrinks the pin whose details are open.
const HOVER_CLASS = 'marker-hovered';
// Pins sharing a z-index stack by latitude, so a raised one is not left
// scaled up underneath its southern neighbour.
const RAISED_Z_INDEX = 2;

// Rows still pointing at their pin, newest last. A focused row keeps its claim
// while the pointer passes over another, so its pin returns once that one is left.
let claims: Marker[] = [];

export function pointAtMarker(marker: Marker | undefined) {
    if (marker) {
        updateClaims([...claims.filter(claim => claim !== marker), marker]);
    }
}

/** A leave from a row that lost the pin to a newer one leaves that row's pin alone. */
export function stopPointingAtMarker(marker: Marker | undefined) {
    updateClaims(claims.filter(claim => claim !== marker));
}

export function stopPointingAtAllMarkers() {
    updateClaims([]);
}

function updateClaims(next: Marker[]) {
    const previous = claims.at(-1);
    claims = next;
    const current = claims.at(-1);
    if (current !== previous) {
        applyHover(previous, false);
        applyHover(current, true);
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
