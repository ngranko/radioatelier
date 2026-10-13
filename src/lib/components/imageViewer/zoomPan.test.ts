import {describe, expect, it} from 'vitest';
import {FIT_VIEW, clampView, panBy, resolveMaxScale, zoomAround, type Frame} from './zoomPan';

const frame: Frame = {
    stage: {width: 1000, height: 600},
    image: {width: 800, height: 600},
    maxScale: 4,
};

describe('zoomAround', () => {
    it('keeps the image point under the anchor where it was', () => {
        const anchor = {x: 100, y: -50};
        const before = {scale: 2, x: 30, y: 20};
        const after = zoomAround(before, 3, anchor, frame);

        const pointBefore = (anchor.x - before.x) / before.scale;
        const pointAfter = (anchor.x - after.x) / after.scale;
        expect(pointAfter).toBeCloseTo(pointBefore);
    });

    it('stops at the fitted size and at the maximum', () => {
        expect(zoomAround(FIT_VIEW, 0.2, {x: 0, y: 0}, frame).scale).toBe(1);
        expect(zoomAround(FIT_VIEW, 99, {x: 0, y: 0}, frame).scale).toBe(4);
    });

    it('recentres the image on the way back to the fitted size', () => {
        const zoomed = zoomAround(FIT_VIEW, 3, {x: 300, y: 200}, frame);

        expect(zoomAround(zoomed, 1, {x: -400, y: 0}, frame)).toEqual(FIT_VIEW);
    });
});

describe('panBy', () => {
    it('does not move an image that still fits the stage', () => {
        expect(panBy(FIT_VIEW, {x: 120, y: -80}, frame)).toEqual(FIT_VIEW);
    });

    it('stops when an image edge meets the stage edge', () => {
        const zoomed = {scale: 2, x: 0, y: 0};

        expect(panBy(zoomed, {x: 5000, y: -5000}, frame)).toEqual({scale: 2, x: 300, y: -300});
    });

    it('pans only along the axis the image overflows on', () => {
        const wide = {scale: 1.2, x: 0, y: 0};

        expect(panBy(wide, {x: 500, y: 40}, frame)).toEqual({scale: 1.2, x: 0, y: 40});
    });
});

describe('clampView', () => {
    it('pulls the image back when the stage grows around it', () => {
        const roomy: Frame = {...frame, stage: {width: 1600, height: 1200}};

        expect(clampView({scale: 2, x: 300, y: -300}, roomy)).toEqual({scale: 2, x: 0, y: 0});
    });
});

describe('resolveMaxScale', () => {
    it('lets a large photo reach its own pixels', () => {
        expect(resolveMaxScale(6000, 800)).toBe(7.5);
    });

    it('keeps a useful range for a small photo', () => {
        expect(resolveMaxScale(400, 800)).toBe(4);
    });
});
