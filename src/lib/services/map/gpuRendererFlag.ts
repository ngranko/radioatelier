import posthog from 'posthog-js';
import {waitForIdentity} from '../posthogIdentity';

// A multivariate flag whose enabled variant is named 'clustered' in PostHog; the renderer
// itself no longer clusters, and isFeatureEnabled collapses any active variant to true.
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
    const deadline = Date.now() + timeoutMs;

    // Signed-out visitors never reach markIdentityReady, and map setup awaits this call
    // before it builds the marker manager, so an unbounded gate would strand their map.
    if (!(await waitForIdentityBefore(deadline))) {
        return false;
    }

    let current: boolean | undefined;
    try {
        current = client.isFeatureEnabled(GPU_RENDERER_FLAG);
    } catch {
        return false;
    }

    return current ?? waitForFlagBefore(client, deadline);
}

function waitForIdentityBefore(deadline: number): Promise<boolean> {
    return new Promise(resolve => {
        const timeout = setTimeout(() => resolve(false), msUntil(deadline));
        void waitForIdentity().then(() => {
            clearTimeout(timeout);
            resolve(true);
        });
    });
}

function waitForFlagBefore(client: FeatureFlagClient, deadline: number): Promise<boolean> {
    return new Promise(resolve => {
        let settled = false;
        let unsubscribe: (() => void) | undefined;
        const timeout = setTimeout(() => finish(false), msUntil(deadline));

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
                    finish(client.isFeatureEnabled(GPU_RENDERER_FLAG) ?? false);
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

function msUntil(deadline: number): number {
    return Math.max(0, deadline - Date.now());
}
