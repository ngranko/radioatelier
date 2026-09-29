import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {Marker} from './marker';
import {pointAtMarker, stopPointingAtMarker} from './markerHover';

function makeMarker() {
    const classList = {toggle: vi.fn()};
    const setZIndex = vi.fn();
    const marker = {
        getHandle: () => ({getElement: () => ({classList}), setZIndex}),
        getZIndex: () => 1,
    } as unknown as Marker;
    return {marker, classList, setZIndex};
}

describe('marker hover', () => {
    beforeEach(() => {
        pointAtMarker(undefined);
    });

    it('raises the pointed-at pin and settles the previous one back', () => {
        const first = makeMarker();
        const second = makeMarker();

        pointAtMarker(first.marker);
        pointAtMarker(second.marker);

        expect(first.classList.toggle).toHaveBeenLastCalledWith('marker-hovered', false);
        expect(first.setZIndex).toHaveBeenLastCalledWith(1);
        expect(second.classList.toggle).toHaveBeenLastCalledWith('marker-hovered', true);
        expect(second.setZIndex).toHaveBeenLastCalledWith(2);
    });

    it('ignores a late leave from a row that already lost the pin', () => {
        const first = makeMarker();
        const second = makeMarker();

        pointAtMarker(first.marker);
        pointAtMarker(second.marker);
        stopPointingAtMarker(first.marker);

        expect(second.classList.toggle).toHaveBeenCalledTimes(1);
    });

    it('settles the pin when its own row is left', () => {
        const only = makeMarker();

        pointAtMarker(only.marker);
        stopPointingAtMarker(only.marker);

        expect(only.classList.toggle).toHaveBeenLastCalledWith('marker-hovered', false);
    });
});
