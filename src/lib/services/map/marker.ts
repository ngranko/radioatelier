import type {LatLngLiteral, MarkerHandle} from '$lib/interfaces/map';
import type {MarkerOptions, MarkerSource} from '$lib/interfaces/marker';

const SOURCE_POLICY = {
    list: {lazy: true, service: false, viewportManaged: true, zIndex: 0},
    search: {lazy: false, service: true, viewportManaged: true, zIndex: 1},
    share: {lazy: false, service: true, viewportManaged: false, zIndex: 1},
    draft: {lazy: false, service: true, viewportManaged: true, zIndex: 1},
} as const satisfies Record<
    MarkerSource,
    {lazy: boolean; service: boolean; viewportManaged: boolean; zIndex: number}
>;

export class Marker {
    private handle?: MarkerHandle;
    public unsubClick?: () => void;
    public unsubPointerDown?: () => void;
    public unsubPointerMove?: () => void;
    public unsubPointerUp?: () => void;
    public isDragged = false;
    private isVisited = false;
    private isRemoved = false;

    public constructor(
        private position: LatLngLiteral,
        public readonly options: MarkerOptions,
    ) {
        this.isVisited = Boolean(options.isVisited);
        this.isRemoved = Boolean(options.isRemoved);
    }

    public getPosition(): LatLngLiteral {
        return this.position;
    }

    public setPosition(position: LatLngLiteral) {
        this.handle?.setPosition(position);
        this.position = position;
    }

    public revertPosition() {
        if (this.handle) {
            this.handle.setPosition(this.position);
        }
    }

    public isLazy(): boolean {
        return SOURCE_POLICY[this.options.source].lazy;
    }

    public isServiceMarker(): boolean {
        return SOURCE_POLICY[this.options.source].service;
    }

    public getZIndex(): number {
        return SOURCE_POLICY[this.options.source].zIndex;
    }

    public isViewportManaged(): boolean {
        return SOURCE_POLICY[this.options.source].viewportManaged;
    }

    public getState() {
        return {isVisited: this.isVisited, isRemoved: this.isRemoved};
    }

    public setState(update: {isVisited?: boolean; isRemoved?: boolean}) {
        if (update.isVisited !== undefined) {
            this.isVisited = update.isVisited;
        }
        if (update.isRemoved !== undefined) {
            this.isRemoved = update.isRemoved;
        }
    }

    public isCreated(): boolean {
        return Boolean(this.handle);
    }

    public getHandle(): MarkerHandle | undefined {
        return this.handle;
    }

    public setHandle(handle: MarkerHandle) {
        this.handle = handle;
    }

    public show() {
        this.handle?.show();
    }

    // Hide is never animated: out-of-viewport pins are already off-screen, and
    // animating a bulk hide during the DOM→deck switch jitters the overlay.
    public hide() {
        this.handle?.hide();
    }

    public remove(onSuccess: () => void) {
        if (!this.handle) {
            return;
        }

        this.unsubClick?.();
        this.unsubClick = undefined;
        this.unsubPointerDown?.();
        this.unsubPointerDown = undefined;
        this.unsubPointerMove?.();
        this.unsubPointerMove = undefined;
        this.unsubPointerUp?.();
        this.unsubPointerUp = undefined;
        this.handle.remove();
        this.handle = undefined;
        onSuccess();
    }
}
