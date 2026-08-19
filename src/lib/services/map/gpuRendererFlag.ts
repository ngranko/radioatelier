import posthog from 'posthog-js';
import {waitForIdentity} from '../posthogIdentity';

export const GPU_RENDERER_FLAG = 'map-gpu-clustered-renderer';

const FLAG_TIMEOUT_MS = 1500;

interface FeatureFlagClient {
    onFeatureFlags(callback: () => void): () => void;
    isFeatureEnabled(key: string): boolean | undefined;
}

export async function resolveGpuRendererFlag(
    client: FeatureFlagClient = posthog,
    timeoutMs = FLAG_TIMEOUT_MS,
): Promise<boolean> {
    let current: boolean | string | undefined;

    await waitForIdentity();

    try {
        current = client.isFeatureEnabled(GPU_RENDERER_FLAG);
    } catch {
        return Promise.resolve(false);
    }

    if (current !== undefined) {
        return Promise.resolve(isEnabledVariant(current));
    }

    return new Promise(resolve => {
        let settled = false;
        let unsubscribe: (() => void) | undefined;
        const timeout = setTimeout(() => finish(false), timeoutMs);

        const finish = (enabled: boolean) => {
            if (settled) {
                return;
            }
            settled = true;
            clearTimeout(timeout);
            unsubscribe?.();
            resolve(enabled);
        };

        try {
            unsubscribe = client.onFeatureFlags(() => {
                try {
                    finish(isEnabledVariant(client.isFeatureEnabled(GPU_RENDERER_FLAG)));
                } catch {
                    finish(false);
                }
            });
        } catch {
            finish(false);
        }
        if (settled) {
            unsubscribe?.();
        }
    });
}

// 'clustered' is the variant name configured in PostHog; the renderer itself no longer clusters.
function isEnabledVariant(value: boolean | string | undefined): boolean {
    return value === true || value === 'clustered';
}
