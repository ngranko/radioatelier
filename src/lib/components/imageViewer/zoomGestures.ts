import {panBy, zoomAround, type Frame, type Point, type View} from './zoomPan';

/** A drag of the fitted image has nowhere to pan to, so it is handed over, locked to one axis. */
export type DragHandlers = {
    drag(travel: Point): void;
    /** `velocity` is in px/ms, measured just before the finger lifted. */
    release(travel: Point, velocity: Point): void;
    /** A second finger or the system took the drag over, so it is not judged at all. */
    cancel(): void;
};

export type ZoomGestureOptions = DragHandlers & {
    getView(): View;
    getFrame(): Frame;
    show(view: View, animate?: boolean): void;
    tap(point: Point): void;
};

type Axis = 'x' | 'y';

const MAX_TAP_TRAVEL = 6;
// a finger resting before it lifts has stopped flicking, however fast it moved earlier
const STALE_VELOCITY_MS = 80;
const ORIGIN: Point = {x: 0, y: 0};
const DOUBLE_TAP_SCALE = 2.5;
const MOUSE_WHEEL_ZOOM_RATE = 0.002;
// Browsers report a trackpad pinch as ctrl+wheel with deltas several times smaller than a
// mouse wheel's, so each unit of a pinch zooms more for both to feel equally fast.
const TRACKPAD_PINCH_ZOOM_RATE = 0.01;

function locateEvent(event: MouseEvent): Point {
    return {x: event.clientX, y: event.clientY};
}

function measureTouch([first, second = first]: Point[]): {centre: Point; spread: number} {
    return {
        centre: {x: (first.x + second.x) / 2, y: (first.y + second.y) / 2},
        spread: Math.hypot(second.x - first.x, second.y - first.y),
    };
}

export class ZoomGestures {
    private options: ZoomGestureOptions;
    private pointers = new Map<number, Point>();
    private node: HTMLElement | null = null;
    private travelled = 0;
    private dragged = ORIGIN;
    private axis: Axis | null = null;
    private velocity = ORIGIN;
    private movedAt = 0;
    private isPinch = false;

    constructor(options: ZoomGestureOptions) {
        this.options = options;
    }

    attach = (node: HTMLElement) => {
        const listeners = new AbortController();
        const {signal} = listeners;
        this.node = node;

        node.addEventListener('pointerdown', this.handlePress, {signal});
        node.addEventListener('pointermove', this.handleMove, {signal});
        node.addEventListener('pointerup', this.handleLift, {signal});
        node.addEventListener('pointercancel', this.handleCancel, {signal});
        node.addEventListener('wheel', this.handleWheel, {signal, passive: false});
        node.addEventListener('click', this.handleClick, {signal});
        node.addEventListener('dblclick', this.handleDoubleClick, {signal});

        return () => listeners.abort();
    };

    private handlePress = (event: PointerEvent) => {
        if (event.button !== 0) {
            return;
        }
        if (this.pointers.size === 0) {
            this.travelled = 0;
            this.isPinch = false;
        }

        this.node?.setPointerCapture(event.pointerId);
        this.pointers.set(event.pointerId, locateEvent(event));

        if (this.pointers.size > 1) {
            // a second finger turns the gesture into a pinch until every finger is lifted, so
            // neither it nor the finger left behind can close the viewer or step to another photo
            this.isPinch = true;
            this.cancelDrag();
        }
    };

    private handleMove = (event: PointerEvent) => {
        if (!this.pointers.has(event.pointerId)) {
            return;
        }

        const before = measureTouch([...this.pointers.values()]);
        this.pointers.set(event.pointerId, locateEvent(event));
        const after = measureTouch([...this.pointers.values()]);

        const delta = {x: after.centre.x - before.centre.x, y: after.centre.y - before.centre.y};
        this.travelled += Math.hypot(delta.x, delta.y);
        this.trackVelocity(delta, event.timeStamp);
        this.applyMove(delta, before.spread ? after.spread / before.spread : 1, before.centre);
    };

    private applyMove(delta: Point, stretch: number, centre: Point) {
        const view = this.options.getView();
        if (this.pointers.size === 1 && view.scale === 1 && !this.isPinch) {
            this.dragAlongAxis(delta);
            return;
        }

        const frame = this.options.getFrame();
        const zoomed = zoomAround(
            view,
            view.scale * stretch,
            this.measureFromCentre(centre),
            frame,
        );
        this.options.show(panBy(zoomed, delta, frame));
    }

    private dragAlongAxis(delta: Point) {
        this.dragged = {x: this.dragged.x + delta.x, y: this.dragged.y + delta.y};
        if (!this.axis && this.travelled > MAX_TAP_TRAVEL) {
            this.axis = Math.abs(this.dragged.x) > Math.abs(this.dragged.y) ? 'x' : 'y';
        }
        if (this.axis) {
            this.options.drag(this.projectOnAxis(this.dragged));
        }
    }

    private trackVelocity(delta: Point, time: number) {
        const elapsed = time - this.movedAt;
        this.movedAt = time;
        if (elapsed > 0) {
            this.velocity = {x: delta.x / elapsed, y: delta.y / elapsed};
        }
    }

    private handleLift = (event: PointerEvent) => {
        this.pointers.delete(event.pointerId);
        if (this.pointers.size > 0 || !this.axis) {
            return;
        }

        const isStale = event.timeStamp - this.movedAt > STALE_VELOCITY_MS;
        const travel = this.projectOnAxis(this.dragged);
        const velocity = isStale ? ORIGIN : this.projectOnAxis(this.velocity);
        this.resetDrag();
        this.options.release(travel, velocity);
    };

    // The system took the pointer away (e.g. an iOS edge swipe). Unlike a lift, that is not the
    // user letting go, so a dragged image eases back into place instead of being judged.
    private handleCancel = (event: PointerEvent) => {
        this.pointers.delete(event.pointerId);
        this.cancelDrag();
    };

    private cancelDrag() {
        if (this.axis) {
            this.options.cancel();
        }
        this.resetDrag();
    }

    private resetDrag() {
        this.dragged = ORIGIN;
        this.axis = null;
    }

    private projectOnAxis(point: Point): Point {
        return this.axis === 'x' ? {x: point.x, y: 0} : {x: 0, y: point.y};
    }

    private handleWheel = (event: WheelEvent) => {
        event.preventDefault();
        const view = this.options.getView();
        const rate = event.ctrlKey ? TRACKPAD_PINCH_ZOOM_RATE : MOUSE_WHEEL_ZOOM_RATE;
        const scale = view.scale * Math.exp(-event.deltaY * rate);
        const anchor = this.measureFromCentre(locateEvent(event));

        this.options.show(zoomAround(view, scale, anchor, this.options.getFrame()));
    };

    // Browsers fire a click at the end of a drag or pinch as well, so only a pointer
    // that barely moved counts as a tap.
    private handleClick = (event: MouseEvent) => {
        if (!this.isPinch && this.travelled <= MAX_TAP_TRAVEL) {
            this.options.tap(locateEvent(event));
        }
    };

    private handleDoubleClick = (event: MouseEvent) => {
        const view = this.options.getView();
        const scale = view.scale > 1 ? 1 : DOUBLE_TAP_SCALE;
        const anchor = this.measureFromCentre(locateEvent(event));

        this.options.show(zoomAround(view, scale, anchor, this.options.getFrame()), true);
    };

    private measureFromCentre(point: Point): Point {
        const rect = this.node!.getBoundingClientRect();
        return {
            x: point.x - rect.left - rect.width / 2,
            y: point.y - rect.top - rect.height / 2,
        };
    }
}
