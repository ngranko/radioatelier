import type {Marker} from '$lib/services/map/marker';
import {describe, expect, it, vi} from 'vitest';
import {ClusteredHybridRenderer} from './clusteredHybridRenderer';

describe('ClusteredHybridRenderer', () => {
    it('does not hide the DOM marker while it is promoted', () => {
        const marker = {usesDomRenderer: () => false} as Marker;
        const domHide = vi.fn();
        const clusteredHide = vi.fn();
        const renderer = Object.create(
            ClusteredHybridRenderer.prototype,
        ) as ClusteredHybridRenderer;
        Object.assign(renderer, {
            dom: {hide: domHide},
            clustered: {hide: clusteredHide},
            promoted: marker,
        });

        renderer.hide(marker);
        expect(domHide).not.toHaveBeenCalled();
        expect(clusteredHide).not.toHaveBeenCalled();

        Object.assign(renderer, {promoted: undefined});
        renderer.hide(marker);
        expect(clusteredHide).toHaveBeenCalledWith(marker);
    });

    it('hands a held sprite to the DOM renderer and takes it back on release', () => {
        const marker = {usesDomRenderer: () => false} as Marker;
        const dom = {
            ensureCreated: vi.fn(),
            reveal: vi.fn(),
            hide: vi.fn(),
            beginDrag: vi.fn(),
            endDrag: vi.fn(),
        };
        const clustered = {setExcludedMarker: vi.fn()};
        const onInteraction = vi.fn();
        const renderer = Object.create(
            ClusteredHybridRenderer.prototype,
        ) as ClusteredHybridRenderer;
        Object.assign(renderer, {dom, clustered, onInteraction});
        const gestures = renderer as unknown as {startDrag(m: Marker): void; endDrag(): void};

        gestures.startDrag(marker);

        expect(clustered.setExcludedMarker).toHaveBeenCalledWith(marker);
        expect(dom.ensureCreated).toHaveBeenCalledWith(marker);
        expect(dom.reveal).toHaveBeenCalledWith(marker);
        expect(dom.beginDrag).toHaveBeenCalledWith(marker);

        gestures.endDrag();

        expect(dom.endDrag).toHaveBeenCalledWith(marker);
        expect(dom.hide).toHaveBeenCalledWith(marker);
        expect(clustered.setExcludedMarker).toHaveBeenLastCalledWith(undefined);
        // Claims the click Maps fires on release, which would otherwise create an object.
        expect(onInteraction).toHaveBeenCalledOnce();
    });

    it('leaves a release that never became a drag to the map click handler', () => {
        const onInteraction = vi.fn();
        const renderer = Object.create(
            ClusteredHybridRenderer.prototype,
        ) as ClusteredHybridRenderer;
        Object.assign(renderer, {onInteraction});

        (renderer as unknown as {endDrag(): void}).endDrag();

        expect(onInteraction).not.toHaveBeenCalled();
    });
});
