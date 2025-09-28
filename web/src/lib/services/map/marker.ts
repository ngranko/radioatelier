import {dragTimeout} from '$lib/stores/map.ts';

export class Marker {
    private position: google.maps.LatLngLiteral;
    private map: google.maps.Map | null = null;
    private marker?: google.maps.marker.AdvancedMarkerElement;
    public source: 'map' | 'list' | 'search';

    public constructor(map: google.maps.Map, position: google.maps.LatLngLiteral, source: 'map' | 'list' | 'search') {
        this.map = map;
        this.position = position;
        this.source = source;
    }

    public getRaw() {
        return this.marker;
    }
    
    public create(
        options: {
            icon: string;
            color: string;
            isDraggable?: boolean;
            onClick?(): void;
            onDragStart?(): void;
            onDragEnd?(newPosition: google.maps.LatLngLiteral): void;
        },
    ): this {
        if (!google.maps.marker.AdvancedMarkerElement || !google.maps.CollisionBehavior) {
            throw new Error('Marker manager library not initialized');
        }
        
        let contentEl: HTMLElement;
        const iconElement = document.createElement('div');
        iconElement.className =
        'w-6 h-6 translate-y-1/2 flex justify-center items-center rounded-full transition-transform transition-opacity duration-100 ease-in-out animate-popin text-sm text-white';
        iconElement.style.backgroundColor = options.color;
        const iconEl = document.createElement('i');
        for (const cls of options.icon.split(/\s+/).filter(Boolean)) {
            iconEl.classList.add(cls);
        }
        iconElement.appendChild(iconEl);
        contentEl = iconElement;
        this.marker = new google.maps.marker.AdvancedMarkerElement({
            position: this.position,
            content: contentEl,
            collisionBehavior: google.maps.CollisionBehavior.REQUIRED,
            gmpClickable: true,
            zIndex: this.source === 'search' ? 1 : 0,
        });
        
        if (options.onClick) {
            this.marker.addListener('gmp-click', options.onClick);
        }
        
        if (options.isDraggable) {
            contentEl.addEventListener('pointerdown', () => {
                if (options.onDragStart) {
                    dragTimeout.set(
                        setTimeout(async () => {
                            options.onDragStart!();
                            (this.marker?.content as HTMLElement).classList.add('marker-dragging');
                        }, 500),
                    );
                }
            });
            contentEl.addEventListener('pointerup', () => {
                if (options.onDragEnd) {
                    dragTimeout.remove();
                    options.onDragEnd(this.marker!.position as google.maps.LatLngLiteral);
                    this.position = this.marker!.position as google.maps.LatLngLiteral;
                    (this.marker?.content as HTMLElement).classList.remove('marker-dragging');
                }
            });
        }
        
        return this;
    }

    public show() {
        if (this.marker) {
            const markerElement = this.marker.content as HTMLElement;
            markerElement.classList.add('animate-popin');
            this.marker.map = this.map;

            setTimeout(() => {
                markerElement.classList.remove('animate-popin');
            }, 200);
        }
    }

    // this function hides a marker without an animation because we do it when a marker either moves
    // out of viewport bounds (in which case we don't see it, so no need for an animation), or if we
    // hide all markers while moving to deck overlay, in which case an animation causes weird jitter,
    // so for now it is sipler to just hide without animation.
    // There is an edge-case where a marker can be out of viewport only partially, in which case the lack
    // of animation will be visible, but I'm willing to live with that for now
    // TODO: Consider implementing true lazy loading (DOM destruction/recreation) if memory usage becomes an issue.
    // Current approach: DOM caching for better performance and smooth UX
    public hide() {
        if (!this.marker || !this.marker.map) {
            return;
        }

        this.marker.map = null;
    }

    public remove(onSuccess: () => void) {
        if (!this.marker) {
            return;
        }

        const markerElement = this.marker.content as HTMLElement;
        if (markerElement) {
            markerElement.classList.add('animate-popout');
            setTimeout(() => {
                if (!this.marker) {
                    return;
                }
                this.marker.map = null;
                this.marker = undefined;
                markerElement.classList.remove('animate-popout');
                onSuccess();
            }, 200);
        } else {
            this.marker.map = null;
            this.marker = undefined;
            onSuccess();
        }
    }
}
