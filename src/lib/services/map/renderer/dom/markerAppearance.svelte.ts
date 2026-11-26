import MarkerIcon from '$lib/components/map/markerIcon.svelte';
import type {MarkerIcon as MarkerIconComponent} from '$lib/interfaces/marker';
import {markerHaloColor} from '$lib/services/colorConverter';
import type {Marker} from '$lib/services/map/marker';
import {PENDING_REVIEW_COLOR} from '$lib/services/map/pendingReviewMark';
import {cn} from '$lib/utils';
import {mount} from 'svelte';

const VISITED_BRIGHT = '#39ff14';
const ICON_CLASS = 'block size-3.5';

interface IconProps {
    icon: MarkerIconComponent;
    className: string;
}

const mountedIcons = new WeakMap<HTMLElement, IconProps>();

/**
 * The single place a DOM marker's looks are derived from its options and state, so re-running it
 * repaints a marker already on the map when its category is swapped or restyled.
 */
export function applyMarkerAppearance(marker: Marker): void {
    const element = marker.getHandle()?.getElement();
    if (!element) {
        return;
    }

    const isInverted = marker.isServiceMarker();
    const {color} = marker.options;
    element.style.backgroundColor = isInverted ? 'white' : color;
    element.style.color = isInverted ? color : '';
    element.style.boxShadow = boxShadow(marker);
    element.style.setProperty('--marker-color', isInverted ? 'white' : color);
    element.classList.toggle('opacity-50', !isInverted && marker.getState().isRemoved);
    applyIcon(element, marker);
    applyPendingDot(element, !isInverted && marker.getState().isPendingReview);
}

// Mirrored by the sprite in renderer/gpu/markerSprites, so promotion to the DOM doesn't shift it.
function applyPendingDot(element: HTMLElement, isShown: boolean): void {
    const existing = element.querySelector(':scope > [data-pending-dot]');
    if (!isShown) {
        existing?.remove();
        return;
    }
    if (!existing) {
        element.append(createPendingDot());
    }
}

function createPendingDot(): HTMLElement {
    const dot = document.createElement('span');
    dot.dataset.pendingDot = '';
    dot.className = 'absolute -top-px -right-px size-2 rounded-full ring-2 ring-white';
    dot.style.backgroundColor = PENDING_REVIEW_COLOR;
    return dot;
}

/** The glyph is mounted once against a reactive props object; a later swap just reassigns it. */
function applyIcon(element: HTMLElement, marker: Marker): void {
    const className = cn(ICON_CLASS, marker.options.iconClassName);
    const mounted = mountedIcons.get(element);
    if (mounted) {
        mounted.icon = marker.options.icon;
        mounted.className = className;
        return;
    }

    const props: IconProps = $state({icon: marker.options.icon, className});
    mountedIcons.set(element, props);
    mount(MarkerIcon, {target: element, props});
}

function boxShadow(marker: Marker): string {
    const {color} = marker.options;
    if (marker.isServiceMarker()) {
        return `0 0 0 3px ${color}, 0 0 0 5px rgba(255,255,255,0.25), 0 2px 4px rgba(0,0,0,0.2)`;
    }

    const halo = markerHaloColor(color);
    if (marker.getState().isVisited) {
        return `0 0 0 1px rgba(0,0,0,0.3), 0 0 0 3px ${VISITED_BRIGHT}, 0 0 0 5px ${halo}, 0 2px 4px rgba(0,0,0,0.2)`;
    }

    return `0 0 0 3px white, 0 0 0 5px ${halo}, 0 2px 4px rgba(0,0,0,0.2)`;
}
