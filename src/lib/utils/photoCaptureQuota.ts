export const PHOTO_CAPTURES_PER_HOUR = 5;
export const PHOTO_CAPTURE_QUOTA_PERIOD_MS = 60 * 60 * 1000;

export interface PhotoCaptureQuota {
    isUnlimited: boolean;
    tokens: number;
    measuredAt: number;
}

// The bucket refills continuously, but a cached query only reruns when the
// bucket is written, so the browser projects the stored level to the present.
export function countAvailableCaptures(quota: PhotoCaptureQuota, now = Date.now()): number {
    const refill =
        ((now - quota.measuredAt) * PHOTO_CAPTURES_PER_HOUR) / PHOTO_CAPTURE_QUOTA_PERIOD_MS;
    return Math.floor(Math.min(PHOTO_CAPTURES_PER_HOUR, quota.tokens + refill));
}
