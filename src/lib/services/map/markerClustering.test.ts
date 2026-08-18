import {afterEach, describe, expect, it, vi} from 'vitest';
import {
    isMarkerClusteringEnabled,
    setMarkerClusteringEnabled,
    subscribeMarkerClustering,
} from './markerClustering';

describe('markerClustering', () => {
    afterEach(() => {
        setMarkerClusteringEnabled(true);
    });

    it('is enabled by default', () => {
        expect(isMarkerClusteringEnabled()).toBe(true);
    });

    it('notifies subscribers when the preference changes', () => {
        const listener = vi.fn();
        const unsubscribe = subscribeMarkerClustering(listener);

        try {
            setMarkerClusteringEnabled(false);

            expect(isMarkerClusteringEnabled()).toBe(false);
            expect(listener).toHaveBeenCalledExactlyOnceWith(false);

            setMarkerClusteringEnabled(false);
            expect(listener).toHaveBeenCalledOnce();

            unsubscribe();
            setMarkerClusteringEnabled(true);
            expect(listener).toHaveBeenCalledOnce();
        } finally {
            unsubscribe();
        }
    });
});
