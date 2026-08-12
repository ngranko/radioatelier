import MarkerIcon from '$lib/components/map/markerIcon.svelte';
import type {MapProvider} from '$lib/interfaces/map';
import type {Marker} from '$lib/services/map/marker';
import {markerBoxShadow} from '$lib/services/map/markerAppearance';
import {cn} from '$lib/utils';
import {mount} from 'svelte';

export class Factory {
    public constructor(private provider: MapProvider) {}

    public create(marker: Marker): void {
        const content = this.createMarkerContent(marker);
        const handle = this.provider.createMarkerHandle(marker.getPosition(), content, {
            zIndex: marker.getZIndex(),
        });
        marker.setHandle(handle);
    }

    private createMarkerContent(marker: Marker): HTMLElement {
        const markerElement = document.createElement('div');
        const isInverted = marker.isServiceMarker();
        const color = marker.options.color;
        markerElement.className = `w-6 h-6 translate-y-1/2 flex justify-center items-center rounded-full transition-transform transition-opacity duration-100 ease-in-out text-sm ${isInverted ? '' : 'text-white'}`;
        markerElement.style.backgroundColor = isInverted ? 'white' : color;
        markerElement.style.color = isInverted ? color : '';
        markerElement.style.boxShadow = markerBoxShadow(color, {inverted: isInverted});
        markerElement.style.setProperty('--marker-color', isInverted ? 'white' : color);
        const baseIconClassName = 'block size-3.5';
        mount(MarkerIcon, {
            target: markerElement,
            props: {
                icon: marker.options.icon,
                className: cn(baseIconClassName, marker.options.iconClassName),
            },
        });
        return markerElement;
    }
}
