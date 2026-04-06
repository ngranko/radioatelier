import {getContrastingColor} from '$lib/services/colorConverter';
import type {Marker} from '$lib/services/map/marker';

export class Styler {
    public apply(marker: Marker) {
        if (marker.getSource() === 'share' || marker.getSource() === 'search') {
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
        element.style.boxShadow = `0 0 0 3px white, 0 0 0 5px ${markerColor}40, 0 2px 4px rgba(0,0,0,0.2)`;

        if (isVisited) {
            const borderColor = getContrastingColor(markerColor);
            element.style.boxShadow = `0 0 0 3px ${borderColor}, 0 0 0 5px ${markerColor}40, 0 2px 4px rgba(0,0,0,0.2)`;
        }
    }

    private applyRemoved(element: HTMLElement, isRemoved: boolean) {
        element.classList.remove('opacity-50');

        if (isRemoved) {
            element.classList.add('opacity-50');
        }
    }
}
