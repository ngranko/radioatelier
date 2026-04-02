export type PointerDragZoomOptions = {
    getZoom(): number;
    setZoom(zoom: number): void;
    getMinZoom?(): number;
    getMaxZoom?(): number;
    onStart?(): void;
    onEnd?(): void;
};

export class PointerDragZoomController {
    private options: PointerDragZoomOptions;
    private isActive = false;
    private initialY = 0;
    private initialZoom = 0;
    private activePointerId: number | null = null;
    private pendingClientY: number | null = null;
    private frameId: number | null = null;
    private lastAppliedZoom: number | null = null;

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
                } catch {
                    // do nothing
                }
                this.activePointerId = event.pointerId;
                this.start(event.clientY);

                tapCount = 0;
            }
        };

        const onPointerMove = (event: PointerEvent) => {
            if (!this.isActive || event.pointerId !== this.activePointerId) {
                return;
            }
            event.preventDefault();
            this.pendingClientY = event.clientY;
            this.scheduleUpdate();
        };

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
            } catch {
                // do nothing
            }
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
        this.pendingClientY = initialY;
        this.lastAppliedZoom = null;
        this.options.onStart?.();
    }

    private scheduleUpdate() {
        if (this.frameId !== null) {
            return;
        }
        this.frameId = requestAnimationFrame(() => {
            this.frameId = null;
            if (!this.isActive || this.pendingClientY === null) {
                return;
            }
            this.update(this.pendingClientY);
        });
    }

    private update(currentY: number) {
        if (!this.isActive) {
            return;
        }
        const deltaY = currentY - this.initialY;
        const zoomDelta = deltaY / 50;
        const minZ = this.options.getMinZoom?.() ?? 1;
        const maxZ = this.options.getMaxZoom?.() ?? 20;
        const newZoom = Math.max(minZ, Math.min(maxZ, this.initialZoom + zoomDelta));
        if (this.lastAppliedZoom !== null && Math.abs(newZoom - this.lastAppliedZoom) < 0.01) {
            return;
        }
        this.lastAppliedZoom = newZoom;
        this.options.setZoom(newZoom);
    }

    private end() {
        if (!this.isActive) {
            return;
        }
        if (this.pendingClientY !== null) {
            this.update(this.pendingClientY);
        }
        this.isActive = false;
        this.pendingClientY = null;
        this.lastAppliedZoom = null;
        if (this.frameId !== null) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
        this.options.onEnd?.();
    }
}
