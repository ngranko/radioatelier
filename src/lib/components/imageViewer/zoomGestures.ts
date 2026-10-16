import {panBy, zoomAround, type Frame, type Point, type View} from './zoomPan';

export type ZoomGestureOptions = {
    getView(): View;
    getFrame(): Frame;
    show(view: View, animate?: boolean): void;
    /** A drag of the fitted image has nowhere to pan to, so it is reported as a pull instead. */
    pull(offset: number): void;
    release(): void;
    /** A sideways drag of the fitted image: 1 asks for the next image, -1 for the previous. */
    swipe(direction: number): void;
    tap(point: Point): void;
};

const TAP_SLOP = 6;
const SWIPE_DISTANCE = 60;
const DOUBLE_TAP_SCALE = 2.5;
const WHEEL_ZOOM_RATE = 0.002;
// Browsers report a trackpad pinch as ctrl+wheel, with far smaller deltas than a real wheel.
const PINCH_WHEEL_ZOOM_RATE = 0.01;

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
    private pulled = 0;
    private swiped = 0;

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
        node.addEventListener('pointercancel', this.handleLift, {signal});
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
        }

        this.node?.setPointerCapture(event.pointerId);
        this.pointers.set(event.pointerId, locateEvent(event));

        if (this.pointers.size > 1) {
            // a second finger turns the gesture into a pinch, which must neither close
            // the viewer as a tap nor carry on dismissing it as a pull
            this.travelled = Infinity;
            this.pulled = 0;
            this.swiped = 0;
            this.options.pull(0);
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
        this.applyMove(delta, before.spread ? after.spread / before.spread : 1, before.centre);
    };

    private applyMove(delta: Point, stretch: number, centre: Point) {
        const view = this.options.getView();
        if (this.pointers.size === 1 && view.scale === 1) {
            this.pulled += delta.y;
            this.swiped += delta.x;
            this.options.pull(this.pulled);
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

    private handleLift = (event: PointerEvent) => {
        this.pointers.delete(event.pointerId);
        if (this.pointers.size > 0 || (this.pulled === 0 && this.swiped === 0)) {
            return;
        }

        const isSwipe = Math.abs(this.swiped) > Math.max(SWIPE_DISTANCE, Math.abs(this.pulled));
        const direction = -Math.sign(this.swiped);
        this.pulled = 0;
        this.swiped = 0;

        if (isSwipe) {
            this.options.pull(0);
            this.options.swipe(direction);
        } else {
            this.options.release();
        }
    };

    private handleWheel = (event: WheelEvent) => {
        event.preventDefault();
        const view = this.options.getView();
        const rate = event.ctrlKey ? PINCH_WHEEL_ZOOM_RATE : WHEEL_ZOOM_RATE;
        const scale = view.scale * Math.exp(-event.deltaY * rate);
        const anchor = this.measureFromCentre(locateEvent(event));

        this.options.show(zoomAround(view, scale, anchor, this.options.getFrame()));
    };

    private handleClick = (event: MouseEvent) => {
        if (this.travelled <= TAP_SLOP) {
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
