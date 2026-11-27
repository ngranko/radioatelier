import {describe, expect, it} from 'vitest';
import {trackArrivals} from './arrivals';

describe('trackArrivals', () => {
    it('announces only items that start matching after the first snapshot', () => {
        const takeFailures = trackArrivals<{id: string; status: string}>(
            item => item.status === 'failed',
        );

        expect(takeFailures([{id: 'a', status: 'failed'}])).toEqual([]);
        expect(
            takeFailures([
                {id: 'a', status: 'processing'},
                {id: 'b', status: 'failed'},
            ]),
        ).toEqual([{id: 'b', status: 'failed'}]);
        expect(
            takeFailures([
                {id: 'a', status: 'failed'},
                {id: 'b', status: 'failed'},
            ]),
        ).toEqual([{id: 'a', status: 'failed'}]);
    });
});
