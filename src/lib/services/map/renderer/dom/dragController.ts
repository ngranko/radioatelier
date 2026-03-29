import type {IMapProvider, LatLngLiteral} from '$lib/interfaces/map';
import type {Marker} from '$lib/services/map/marker';
import {removeDragTimeout, setDragTimeout} from '$lib/state/marker.svelte';
import {setDraggable} from '../../map.svelte';

export class DragController {
    private skipClick = false;

    public constructor(private provider: IMapProvider) {}

    public attach(marker: Marker): void {
        const handle = marker.getHandle();
        if (!handle) {
            return;
        }

        this.attachClick(marker);
        this.attachDragIfNeeded(marker);
    }

    public detach(marker: Marker): void {
        marker.clickListener?.();
        marker.clickListener = undefined;
        this.removeDomPointerListeners(marker);
        this.removeMapMoveListener(marker);
    }

    private attachClick(marker: Marker): void {
        const handle = marker.getHandle();
        if (!handle) {
            return;
        }

        marker.clickListener?.();
        marker.clickListener = handle.addClickListener(this.handleClick(marker));
    }

    private handleClick(marker: Marker) {
        return () => {
            if (this.skipClick) {
                this.skipClick = false;
                return;
            }
            marker.getOnClick()?.();
        };
    }

    private attachDragIfNeeded(marker: Marker): void {
        if (!marker.isDraggable()) {
            return;
        }
        this.attachPointerDown(marker);
        this.attachPointerUp(marker);
    }

    private attachPointerDown(marker: Marker): void {
        const element = marker.getHandle()?.getElement();
        if (!element) {
            return;
        }

        if (marker.pointerDownListener) {
            element.removeEventListener('pointerdown', marker.pointerDownListener);
        }

        const onPointerDown = this.handlePointerDown(marker);
        element.addEventListener('pointerdown', onPointerDown);
        marker.pointerDownListener = onPointerDown;
    }

    private handlePointerDown(marker: Marker) {
        return () => {
            setDragTimeout(window.setTimeout(() => this.startDrag(marker), 300));
        };
    }

    private startDrag(marker: Marker) {
        const element = marker.getHandle()?.getElement();
        if (!element) {
            return;
        }
        marker.pointerMoveListener = this.provider.onPointerMove(
            (latLng: LatLngLiteral) => {
                marker.isDragged = true;
                marker.setPosition(latLng);
            },
        );
        this.skipClick = true;
        setDraggable(false);
        marker.getOnDragStart()?.();
        element.classList.add('marker-dragging');
    }

    private attachPointerUp(marker: Marker): void {
        const element = marker.getHandle()?.getElement();
        if (!element) {
            return;
        }

        if (marker.pointerUpListener) {
            element.removeEventListener('pointerup', marker.pointerUpListener);
            element.removeEventListener('pointercancel', marker.pointerUpListener);
        }

        const onPointerUp = this.handlePointerUp(marker);
        element.addEventListener('pointerup', onPointerUp);
        element.addEventListener('pointercancel', onPointerUp);
        marker.pointerUpListener = onPointerUp;
    }

    private handlePointerUp(marker: Marker) {
        return () => {
            removeDragTimeout();
            this.removeMapMoveListener(marker);
            setDraggable(true);
            if (marker.isDragged) {
                marker.isDragged = false;
                marker.getOnDragEnd()?.();
            }
            marker.getHandle()?.getElement()?.classList.remove('marker-dragging');
        };
    }

    private removeMapMoveListener(marker: Marker) {
        if (marker.pointerMoveListener) {
            marker.pointerMoveListener();
            marker.pointerMoveListener = undefined;
        }
    }

    private removeDomPointerListeners(marker: Marker) {
        const element = marker.getHandle()?.getElement();
        if (!element) {
            return;
        }

        if (marker.pointerDownListener) {
            element.removeEventListener('pointerdown', marker.pointerDownListener);
            marker.pointerDownListener = undefined;
        }

        if (marker.pointerUpListener) {
            element.removeEventListener('pointerup', marker.pointerUpListener);
            element.removeEventListener('pointercancel', marker.pointerUpListener);
            marker.pointerUpListener = undefined;
        }
    }
}
