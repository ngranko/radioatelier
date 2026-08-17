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
});
