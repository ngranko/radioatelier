import { getContrastingColor } from '$lib/services/colorConverter';
import type { Marker } from '$lib/services/map/marker';

export class Styler {
    public apply(marker: Marker) {
        const {isVisited, isRemoved} = marker.getState();
        const markerContent = marker.getRaw()?.content;
        if (!markerContent || !(markerContent instanceof HTMLElement)) {
            return;
        }

        this.applyVisited(markerContent, isVisited, marker.getColor());
        this.applyRemoved(markerContent, isRemoved);
    }

    private applyVisited(markerContent: HTMLElement, isVisited: boolean, markerColor: string) {
        markerContent.style.removeProperty('box-shadow');

        if (isVisited) {
            const borderColor = getContrastingColor(markerColor);
            markerContent.style.boxShadow = `0 0 0 4px ${borderColor}`;
        }
    }

    private applyRemoved(markerContent: HTMLElement, isRemoved: boolean) {
        markerContent.classList.remove('opacity-50');

        if (isRemoved) {
            markerContent.classList.add('opacity-50');
        }
    }
}