import posthog from 'posthog-js';

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
    return waitForFlagBefore(client, deadline);
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
                    finish(Boolean(client.isFeatureEnabled(GPU_RENDERER_FLAG)));
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
