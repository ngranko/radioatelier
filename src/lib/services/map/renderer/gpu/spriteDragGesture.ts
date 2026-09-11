import type {Marker} from '$lib/services/map/marker';
import type {DeckOverlayHost} from '$lib/services/map/providers/google/deckOverlayHost';
import type {MarkerPoint} from '$lib/services/map/renderer/gpu/markerPoints';
import {MarkerHold} from '$lib/services/map/renderer/markerHold';

const PICK_RADIUS_PX = 4;

interface GestureHandlers {
    onHold(marker: Marker): void;
    onRelease(): void;
}

/**
 * GPU markers have no element to press on, so the hold that starts a reposition is detected against
 * deck's picking buffer instead. The marker is then handed to the DOM renderer, which already owns
 * dragging and its pulse animation.
 */
export class SpriteDragGesture {
    private activePointerId?: number;
    private hold = new MarkerHold();

    public constructor(
        private container: HTMLElement,
        private overlay: DeckOverlayHost,
        private handlers: GestureHandlers,
    ) {}

    public attach(): void {
        this.container.addEventListener('pointerdown', this.handlePointerDown);
        // The release is watched globally: a drag that started on a sprite can end anywhere.
        window.addEventListener('pointerup', this.handlePointerUp);
        window.addEventListener('pointercancel', this.handlePointerUp);
    }

    public detach(): void {
        this.container.removeEventListener('pointerdown', this.handlePointerDown);
        window.removeEventListener('pointerup', this.handlePointerUp);
        window.removeEventListener('pointercancel', this.handlePointerUp);
        this.activePointerId = undefined;
        this.hold.cancel();
    }

    private handlePointerDown = (event: PointerEvent): void => {
        // A second finger landing mid-hold is never primary, so it cannot restart the gesture on
        // another marker. A stale pointer whose release never arrived must not block the next press.
        if (!event.isPrimary || event.button !== 0) {
            return;
        }

        const marker = this.draggableAt(event);
        if (!marker) {
            return;
        }
        this.activePointerId = event.pointerId;
        this.hold.arm(event, () => this.handlers.onHold(marker));
    };

    private handlePointerUp = (event: PointerEvent): void => {
        // Only the pointer that began the hold ends it; another one lifting leaves the drag alive.
        if (event.pointerId !== this.activePointerId) {
            return;
        }

        this.activePointerId = undefined;
        this.hold.cancel();
        this.handlers.onRelease();
    };

    private draggableAt(event: PointerEvent): Marker | undefined {
        const {left, top} = this.container.getBoundingClientRect();
        const picked = this.overlay.pickAt(
            event.clientX - left,
            event.clientY - top,
            PICK_RADIUS_PX,
        ) as MarkerPoint | undefined;

        return picked?.marker.options.isDraggable ? picked.marker : undefined;
    }
}
