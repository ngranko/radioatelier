import type {MarkerOptions, MarkerSource} from '$lib/interfaces/marker';

export class Marker {
    private marker?: google.maps.marker.AdvancedMarkerElement;
    private listenerReference: {onPointerDown(): void, onPointerUp(): void} | undefined;
    private isVisited = false;
    private isRemoved = false;

    public constructor(
        private map: google.maps.Map,
        private position: google.maps.LatLngLiteral,
        private options: MarkerOptions,
    ) {
        this.isVisited = Boolean(options.isVisited);
        this.isRemoved = Boolean(options.isRemoved);
    }

    public getPosition(): google.maps.LatLngLiteral {
        return this.position;
    }

    public setPosition(position: google.maps.LatLngLiteral) {
        this.position = position;
        if (this.marker) {
            this.marker.position = position;
        }
    }

    public getSource(): MarkerSource {
        return this.options.source;
    }

    public getColor(): string {
        return this.options.color;
    }

    public getMap(): google.maps.Map {
        return this.map;
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

    public getOnCreated(): (() => void) | undefined {
        return this.options.onCreated;
    }

    public getIcon(): string {
        return this.options.icon;
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
        return Boolean(this.marker);
    }

    public getRaw() {
        return this.marker;
    }

    public setRaw(raw: google.maps.marker.AdvancedMarkerElement) {
        this.marker = raw;
    }

    public getListenerReference() {
        return this.listenerReference;
    }

    public setListenerReference(listeners?: {onPointerDown(): void, onPointerUp(): void}) {
        this.listenerReference = listeners;
    }

    public create() {
        this.options.onCreated?.();
    }

    public show() {
        if (!this.marker) {
            return;
        }

        if (!this.marker.map) {
            this.marker.map = this.map;
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

        this.listenerReference = undefined;
        this.marker.map = null;
        this.marker = undefined;
        onSuccess();
    }
}
