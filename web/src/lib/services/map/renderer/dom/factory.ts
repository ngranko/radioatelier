import type { Marker } from '$lib/services/map/marker';

export class Factory {
    public create(marker: Marker): void {
        const raw = this.createAdvancedMarkerElement(marker, this.createMarkerContent(marker));
        marker.setRaw(raw);
        marker.create();
    }

    private createMarkerContent(marker: Marker): HTMLElement {
        const iconElement = document.createElement('div');
        iconElement.className = 'w-6 h-6 translate-y-1/2 flex justify-center items-center rounded-full transition-transform transition-opacity duration-100 ease-in-out text-sm text-white';
        iconElement.style.backgroundColor = marker.getColor();
        iconElement.appendChild(this.createIcon(marker));
        return iconElement;
    }

    private createIcon(marker: Marker): HTMLElement {
        const icon = document.createElement('i');
        for (const cls of marker.getIcon().split(/\s+/).filter(Boolean)) {
            icon.classList.add(cls);
        }
        return icon;
    }

    private createAdvancedMarkerElement(marker: Marker, content: HTMLElement): google.maps.marker.AdvancedMarkerElement {
        return new google.maps.marker.AdvancedMarkerElement({
            position: marker.getPosition(),
            content,
            collisionBehavior: google.maps.CollisionBehavior.REQUIRED,
            gmpClickable: true,
            zIndex: marker.getSource() === 'search' ? 1 : 0,
        });
    }
}