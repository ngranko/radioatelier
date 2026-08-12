import type {Marker} from '$lib/services/map/marker';
import {markerBoxShadow} from '$lib/services/map/markerAppearance';

export class Styler {
    public apply(marker: Marker) {
        if (marker.isServiceMarker()) {
            return;
        }

        const {isVisited, isRemoved} = marker.getState();
        const element = marker.getHandle()?.getElement();
        if (!element) {
            return;
        }

        element.style.boxShadow = markerBoxShadow(marker.options.color, {visited: isVisited});
        element.classList.toggle('opacity-50', isRemoved);
    }
}
