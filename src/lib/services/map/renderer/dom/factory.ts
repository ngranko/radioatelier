import MarkerIcon from '$lib/components/map/markerIcon.svelte';
import type {IMapProvider} from '$lib/interfaces/map';
import type {Marker} from '$lib/services/map/marker';
import {cn} from '$lib/utils';
import {mount} from 'svelte';

export class Factory {
    public constructor(private provider: IMapProvider) {}

    public create(marker: Marker): void {
        const content = this.createMarkerContent(marker);
        const handle = this.provider.createMarkerHandle(marker.getPosition(), content, {
            zIndex: marker.getSource() === 'search' ? 1 : 0,
        });
        marker.setHandle(handle);
        marker.create();
    }

    private createMarkerContent(marker: Marker): HTMLElement {
        const markerElement = document.createElement('div');
        markerElement.className =
            'w-6 h-6 translate-y-1/2 flex justify-center items-center rounded-full transition-transform transition-opacity duration-100 ease-in-out text-sm text-white';
        markerElement.style.backgroundColor = marker.getColor();
        markerElement.style.boxShadow = `0 0 0 3px white, 0 0 0 5px ${marker.getColor()}40, 0 2px 4px rgba(0,0,0,0.2)`;
        markerElement.style.setProperty('--marker-color', marker.getColor());
        const baseIconClassName =
            typeof marker.getIcon() === 'string' ? 'block text-sm leading-none' : 'block size-3.5';
        mount(MarkerIcon, {
            target: markerElement,
            props: {
                icon: marker.getIcon(),
                className: cn(baseIconClassName, marker.getIconClassName()),
            },
        });
        return markerElement;
    }
}
