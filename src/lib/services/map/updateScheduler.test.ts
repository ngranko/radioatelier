import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {markerLifecycle} from './markerLifecycle';
import {UpdateScheduler} from './updateScheduler';

describe('UpdateScheduler lifecycle', () => {
    beforeEach(() => {
        markerLifecycle.reset();
    });

    afterEach(() => {
        vi.useRealTimers();
        markerLifecycle.reset();
    });

    it('stays busy from schedule until complete', () => {
        vi.useFakeTimers();
        const scheduler = new UpdateScheduler(() => {});
        scheduler.schedule();
        expect(markerLifecycle.isIdle).toBe(false);

        vi.runAllTimers();
        expect(markerLifecycle.isIdle).toBe(false);

        scheduler.complete();
        expect(markerLifecycle.isIdle).toBe(true);
    });
});
