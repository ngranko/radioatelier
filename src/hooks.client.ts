import {dev} from '$app/environment';
import {PUBLIC_POSTHOG_HOST, PUBLIC_POSTHOG_PROJECT_TOKEN} from '$env/static/public';
import type {HandleClientError} from '@sveltejs/kit';
import posthog from 'posthog-js';

export async function init() {
    posthog.init(PUBLIC_POSTHOG_PROJECT_TOKEN, {
        api_host: '/ingest',
        ui_host: PUBLIC_POSTHOG_HOST,
        defaults: '2026-01-30',
        capture_exceptions: true,
        logs: {
            serviceName: 'radioatelier-web',
            environment: dev ? 'development' : 'production',
            serviceVersion: __APP_SERVICE_VERSION__,
        },
    });
}

export const handleError: HandleClientError = async ({error, status, message}) => {
    posthog.captureException(error);
    return {message, status};
};
