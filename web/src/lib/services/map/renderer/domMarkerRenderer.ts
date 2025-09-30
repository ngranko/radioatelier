import type {Marker} from '../marker';
import type {MarkerRenderer} from './markerRenderer';

export class DomMarkerRenderer implements MarkerRenderer {
    public ensureCreated(marker: Marker): void {
        if (!marker.isCreated()) {
            const iconElement = document.createElement('div');
            iconElement.className = 'w-6 h-6 translate-y-1/2 flex justify-center items-center rounded-full transition-transform transition-opacity duration-100 ease-in-out text-sm text-white';
            iconElement.style.backgroundColor = marker.getColor();
            const iconEl = document.createElement('i');
            for (const cls of marker.getIcon().split(/\s+/).filter(Boolean)) {
                iconEl.classList.add(cls);
            }
            iconElement.appendChild(iconEl);

            const raw = new google.maps.marker.AdvancedMarkerElement({
                position: marker.getPosition(),
                content: iconElement,
                collisionBehavior: google.maps.CollisionBehavior.REQUIRED,
                gmpClickable: true,
                zIndex: marker.getSource() === 'search' ? 1 : 0,
            });
            
            marker.setRaw(raw);
            this.attachEvents(marker);
            marker.create();
        }
    }

    public syncAll(iterable: Iterable<Marker>): void {
        // No-op; DOM markers are created on demand
    }

    public show(marker: Marker): void {
        const raw = marker.getRaw();
        if (!raw) {
            return;
        };

        const element = raw.content as HTMLElement;
        element.classList.add('animate-popin');
        setTimeout(() => {
            element.classList.remove('animate-popin');
        }, 200);
        
        marker.show();
    }

    public hide(marker: Marker): void {
        marker.hide();
    }

    public remove(marker: Marker, onRemoved?: () => void): void {
        const raw = marker.getRaw();
        if (!raw) {
            onRemoved?.();
            return;
        }
        
        const element = raw.content as HTMLElement;
        element.classList.add('animate-popout');
        setTimeout(() => {
            element.classList.remove('animate-popout');
            this.detachEvents(marker);
            marker.remove(() => onRemoved?.());
        }, 200);
    }

    public destroy(): void {
        // No global resources to clean for DOM markers
    }

    private attachEvents(marker: Marker): void {
        const raw = marker.getRaw();
        if (!raw) {
            return;
        }
        
        const onClick = marker.getOnClick();
        if (onClick) {
            raw.addListener('gmp-click', onClick);
        }
        
        if (marker.isDraggable()) {
            const element = raw.content as HTMLElement;
            
            const onPointerDown = () => {
                const start = marker.getOnDragStart();
                if (start) {
                    // Delay to distinguish click vs drag intent
                    (window as any).dragTimeout?.set?.(
                        setTimeout(() => {
                            start();
                            (raw.content as HTMLElement).classList.add('marker-dragging');
                        }, 300),
                    );
                }
            };

            const onPointerUp = () => {
                const end = marker.getOnDragEnd();
                if (end) {
                    (window as any).dragTimeout?.remove?.();
                    end(raw.position as google.maps.LatLngLiteral);
                    (raw.content as HTMLElement).classList.remove('marker-dragging');
                }
            };

            element.addEventListener('pointerdown', onPointerDown);
            element.addEventListener('pointerup', onPointerUp);

            marker.setListenerReference({onPointerDown, onPointerUp});
        }
    }

    private detachEvents(marker: Marker): void {
        const raw = marker.getRaw();
        if (!raw) {
            return;
        }

        google.maps.event.clearInstanceListeners(raw);

        const element = raw.content as HTMLElement;
        const listenerReference = marker.getListenerReference();
        if (listenerReference) {
            element.removeEventListener('pointerdown', listenerReference.onPointerDown);
            element.removeEventListener('pointerup', listenerReference.onPointerUp);
            marker.setListenerReference(undefined);
        }
    }
}
