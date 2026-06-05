import {describe, expect, it} from 'vitest';
import {clerkTimestamp} from './clerkTimestamps';

describe('clerkTimestamp', () => {
    it('returns null for invalid values', () => {
        expect(clerkTimestamp(null)).toBeNull();
        expect(clerkTimestamp(undefined)).toBeNull();
        expect(clerkTimestamp('1654012591514')).toBeNull();
    });

    it('keeps millisecond timestamps unchanged', () => {
        expect(clerkTimestamp(1_654_012_591_514)).toBe(1_654_012_591_514);
    });

    it('converts second timestamps to milliseconds', () => {
        expect(clerkTimestamp(1_654_012_591)).toBe(1_654_012_591_000);
    });
});
