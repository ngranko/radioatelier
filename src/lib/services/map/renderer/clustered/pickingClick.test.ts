import {describe, expect, it, vi} from 'vitest';
import {handleClusteredPickingClick} from './pickingClick';

describe('handleClusteredPickingClick', () => {
    it('invokes the pick handler before stopping the event', () => {
        const order: string[] = [];

        handleClusteredPickingClick(
            {object: {id: 1}},
            {
                srcEvent: {stop: () => order.push('stop')},
                stopPropagation: () => order.push('stopPropagation'),
            },
            object => {
                order.push(`pick:${object.id}`);
            },
        );

        expect(order).toEqual(['pick:1', 'stop', 'stopPropagation']);
    });

    it('handles Google Maps overlay mock events that omit stopPropagation', () => {
        const onPick = vi.fn();
        const stop = vi.fn();

        const handled = handleClusteredPickingClick({object: 'marker'}, {srcEvent: {stop}}, onPick);

        expect(handled).toBe(true);
        expect(onPick).toHaveBeenCalledWith('marker');
        expect(stop).toHaveBeenCalledOnce();
    });

    it('ignores clicks that did not hit a pickable object', () => {
        const onPick = vi.fn();
        const stopPropagation = vi.fn();

        expect(handleClusteredPickingClick({object: null}, {stopPropagation}, onPick)).toBe(false);
        expect(handleClusteredPickingClick({}, {stopPropagation}, onPick)).toBe(false);
        expect(onPick).not.toHaveBeenCalled();
        expect(stopPropagation).not.toHaveBeenCalled();
    });
});
