import {throttle} from '$lib/utils';

export type PointerDragZoomOptions = {
    getZoom(): number;
    setZoom(zoom: number): void;
    onStart?(): void;
    onEnd?(): void;
};

export class PointerDragZoomController {
    private options: PointerDragZoomOptions;
    private isActive = false;
    private initialY = 0;
    private initialZoom = 0;
    private activePointerId: number | null = null;

    constructor(options: PointerDragZoomOptions) {
        this.options = options;
    }

    attachDoubleTapDragZoom(element: HTMLElement) {
        let lastTapTime = 0;
        let tapCount = 0;
        let activeTouchCount = 0;

        const onPointerDown = (event: PointerEvent) => {
            if (event.pointerType === 'touch') {
                activeTouchCount++;
                const isMultiTouch = activeTouchCount > 1;
                if (isMultiTouch || !event.isPrimary) {
                    tapCount = 0;
                    lastTapTime = 0;
                    return;
                }
            }

            const now = Date.now();
            tapCount = now - lastTapTime < 500 ? tapCount + 1 : 1;
            lastTapTime = now;

            if (tapCount === 2) {
                event.preventDefault();
                try {
                    (event.currentTarget as Element).setPointerCapture(event.pointerId);
                } catch {}
                this.activePointerId = event.pointerId;
                this.start(event.clientY);

                tapCount = 0;
            }
        };

        const onPointerMove = throttle((event: PointerEvent) => {
            if (!this.isActive || event.pointerId !== this.activePointerId) {
                return;
            }
            event.preventDefault();
            this.update(event.clientY);
        }, 16); // ~60fps

        const endGesture = (event: PointerEvent) => {
            if (event.pointerType === 'touch') {
                activeTouchCount = Math.max(0, activeTouchCount - 1);
            }

            if (!this.isActive || event.pointerId !== this.activePointerId) {
                return;
            }

            this.activePointerId = null;
            this.end();
            try {
                (event.currentTarget as Element).releasePointerCapture(event.pointerId);
            } catch {}
        };

        element.addEventListener('pointerdown', onPointerDown, {passive: false});
        element.addEventListener('pointermove', onPointerMove as EventListener, {passive: false});
        element.addEventListener('pointerup', endGesture);
        element.addEventListener('pointercancel', endGesture);

        return () => {
            element.removeEventListener('pointerdown', onPointerDown as EventListener);
            element.removeEventListener('pointermove', onPointerMove as EventListener);
            element.removeEventListener('pointerup', endGesture as EventListener);
            element.removeEventListener('pointercancel', endGesture as EventListener);
        };
    }

    private start(initialY: number) {
        this.isActive = true;
        this.initialY = initialY;
        this.initialZoom = this.options.getZoom();
        this.options.onStart?.();
    }

    private update(currentY: number) {
        if (!this.isActive) {
            return;
        }
        const deltaY = currentY - this.initialY;
        const zoomDelta = deltaY / 50;
        const newZoom = Math.max(1, Math.min(20, this.initialZoom + zoomDelta));
        this.options.setZoom(newZoom);
    }

    private end() {
        if (!this.isActive) {
            return;
        }
        this.isActive = false;
        this.options.onEnd?.();
    }
}
