import posthog from 'posthog-js';

export const CLUSTERED_RENDERER_FLAG = 'map-gpu-clustered-renderer';

const FLAG_TIMEOUT_MS = 1500;

interface FeatureFlagClient {
    getFeatureFlag(key: string): boolean | string | undefined;
    onFeatureFlags(callback: () => void): () => void;
}

export function resolveClusteredRendererFlag(
    client: FeatureFlagClient = posthog,
    timeoutMs = FLAG_TIMEOUT_MS,
): Promise<boolean> {
    const current = client.getFeatureFlag(CLUSTERED_RENDERER_FLAG);
    if (current !== undefined) {
        return Promise.resolve(isClusteredVariant(current));
    }

    return new Promise(resolve => {
        let settled = false;
        let unsubscribe: (() => void) | undefined;
        const timeout = setTimeout(() => finish(false), timeoutMs);

        const finish = (enabled: boolean) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            unsubscribe?.();
            resolve(enabled);
        };

        unsubscribe = client.onFeatureFlags(() => {
            finish(isClusteredVariant(client.getFeatureFlag(CLUSTERED_RENDERER_FLAG)));
        });
        if (settled) unsubscribe();
    });
}

function isClusteredVariant(value: boolean | string | undefined): boolean {
    return value === true || value === 'clustered';
}
