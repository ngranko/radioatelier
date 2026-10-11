import {PUBLIC_POSTHOG_HOST, PUBLIC_POSTHOG_PROJECT_TOKEN} from '$env/static/public';
import {PostHog} from 'posthog-node';

let posthogClient: PostHog | null = null;

export function getPostHogClient() {
    if (!posthogClient) {
        posthogClient = new PostHog(PUBLIC_POSTHOG_PROJECT_TOKEN, {
            host: PUBLIC_POSTHOG_HOST,
            flushAt: 1,
            flushInterval: 0,
        });
        // Captures send in the background instead of being awaited by the
        // request, so drain whatever is still in flight on a graceful shutdown.
        process.on('sveltekit:shutdown', () => posthogClient?.shutdown());
    }
    return posthogClient;
}
