import MarkerIcon from '$lib/components/map/markerIcon.svelte';
import type {Marker} from '$lib/services/map/marker';
import {mount} from 'svelte';

export class Factory {
    public create(marker: Marker): void {
        const raw = this.createAdvancedMarkerElement(marker, this.createMarkerContent(marker));
        marker.setRaw(raw);
        marker.create();
    }

    private createMarkerContent(marker: Marker): HTMLElement {
        const iconElement = document.createElement('div');
        iconElement.className =
            'w-6 h-6 translate-y-1/2 flex justify-center items-center rounded-full transition-transform transition-opacity duration-100 ease-in-out text-sm text-white';
        iconElement.style.backgroundColor = marker.getColor();
        const baseIconClassName =
            typeof marker.getIcon() === 'string' ? 'block text-sm leading-none' : 'block size-3.5';
        const iconClassName = [baseIconClassName, marker.getIconClassName()]
            .filter(Boolean)
            .join(' ');
        mount(MarkerIcon, {
            target: iconElement,
            props: {
                icon: marker.getIcon(),
                className: iconClassName,
            },
        });
        return iconElement;
    }

    private createAdvancedMarkerElement(
        marker: Marker,
        content: HTMLElement,
    ): google.maps.marker.AdvancedMarkerElement {
        return new google.maps.marker.AdvancedMarkerElement({
            position: marker.getPosition(),
            content,
            collisionBehavior: google.maps.CollisionBehavior.REQUIRED,
            gmpClickable: true,
            zIndex: marker.getSource() === 'search' ? 1 : 0,
        });
    }
}
