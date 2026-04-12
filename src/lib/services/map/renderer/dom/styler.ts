import {markerHaloColor} from '$lib/services/colorConverter';
import type {Marker} from '$lib/services/map/marker';

const VISITED_BRIGHT = '#39ff14';

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

        this.applyVisited(element, isVisited, marker.getColor());
        this.applyRemoved(element, isRemoved);
    }

    private applyVisited(element: HTMLElement, isVisited: boolean, markerColor: string) {
        const haloColor = markerHaloColor(markerColor);

        if (isVisited) {
            element.style.boxShadow = `0 0 0 1px rgba(0,0,0,0.3), 0 0 0 3px ${VISITED_BRIGHT}, 0 0 0 5px ${haloColor}, 0 2px 4px rgba(0,0,0,0.2)`;
        } else {
            element.style.boxShadow = `0 0 0 3px white, 0 0 0 5px ${haloColor}, 0 2px 4px rgba(0,0,0,0.2)`;
        }
    }

    private applyRemoved(element: HTMLElement, isRemoved: boolean) {
        element.classList.remove('opacity-50');

        if (isRemoved) {
            element.classList.add('opacity-50');
        }
    }
}
