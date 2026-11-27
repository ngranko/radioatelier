import {describe, expect, it} from 'vitest';
import {countAvailableCaptures, PHOTO_CAPTURE_QUOTA_PERIOD_MS} from './photoCaptureQuota';

describe('countAvailableCaptures', () => {
    it('refills an emptied bucket over the hour without overflowing it', () => {
        const quota = {isUnlimited: false, tokens: 0, measuredAt: 0};

        expect(countAvailableCaptures(quota, 0)).toBe(0);
        expect(countAvailableCaptures(quota, PHOTO_CAPTURE_QUOTA_PERIOD_MS / 5)).toBe(1);
        expect(countAvailableCaptures(quota, PHOTO_CAPTURE_QUOTA_PERIOD_MS * 3)).toBe(5);
    });
});
