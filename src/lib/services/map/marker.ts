import type {LatLngLiteral, MarkerHandle} from '$lib/interfaces/map';
import type {MarkerIcon, MarkerOptions, MarkerSource} from '$lib/interfaces/marker';

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
        private options: MarkerOptions,
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

    public getSource(): MarkerSource {
        return this.options.source;
    }

    public isLazy(): boolean {
        return this.options.source === 'list';
    }

    public isServiceMarker(): boolean {
        return (
            this.options.source === 'share' ||
            this.options.source === 'search' ||
            this.options.source === 'draft'
        );
    }

    public usesDomRenderer(): boolean {
        return this.isServiceMarker();
    }

    public getZIndex(): number {
        return this.isServiceMarker() ? 1 : 0;
    }

    public isViewportManaged(): boolean {
        return this.options.source !== 'share';
    }

    public getColor(): string {
        return this.options.color;
    }

    public isDraggable(): boolean {
        return Boolean(this.options.isDraggable);
    }

    public getOnClick(): (() => void) | undefined {
        return this.options.onClick;
    }

    public getOnDragStart(): (() => void) | undefined {
        return this.options.onDragStart;
    }

    public getOnDragEnd(): (() => void) | undefined {
        return this.options.onDragEnd;
    }

    public getIcon(): MarkerIcon {
        return this.options.icon;
    }

    public getIconClassName(): string | undefined {
        return this.options.iconClassName;
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

    public create() {
        // No-op
    }

    public show() {
        this.handle?.show();
    }

    // this function hides a marker without an animation because we do it when a marker either moves
    // out of viewport bounds (in which case we don't see it, so no need for an animation), or if we
    // hide all markers while moving to deck overlay, in which case an animation causes weird jitter,
    // so for now it is simpler to just hide without animation.
    // There is an edge-case where a marker can be out of viewport only partially, in which case the lack
    // of animation will be visible, but I'm willing to live with that for now
    // TODO: Consider implementing true lazy loading (DOM destruction/recreation) if memory usage becomes an issue.
    // Current approach: DOM caching for better performance and smooth UX
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
