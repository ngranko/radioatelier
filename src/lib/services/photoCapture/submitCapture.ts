import {
    photoCaptureState,
    refreshUnsentCaptures,
    resolveCapturePin,
} from '$lib/state/photoCapture.svelte';
import {resizeImage} from '$lib/utils/imageResizer';
import type {ConvexClient} from 'convex/browser';
import {ConvexError} from 'convex/values';
import posthog from 'posthog-js';
import {toast} from 'svelte-sonner';
import {resolveCaptureLocation} from './captureLocation';
import {describeCapturePlace, sendCapture} from './sendCapture';
import {type CaptureDraft, keepUnsentCapture} from './unsentCaptures';

export async function submitPhotoCapture(client: ConvexClient, file: File) {
    photoCaptureState.isSending = true;
    try {
        const [image, location] = await Promise.all([
            resizeImage(file),
            resolveCaptureLocation(file),
        ]);
        if (!location) {
            return;
        }
        posthog.capture('photo_captured', {location_source: location.source});
        const {latitude, longitude} = location;
        const place = await describeCapturePlace(client, {latitude, longitude});
        await deliverCapture(client, {image, latitude, longitude, ...place});
    } catch (error) {
        console.error('Failed to prepare the photo capture:', error);
        toast.error('Не удалось обработать фото');
    } finally {
        // A failed resize rejects while the map may still be asking for a pin.
        if (photoCaptureState.isPinRequested) {
            resolveCapturePin(null);
        }
        photoCaptureState.isSending = false;
    }
}

async function deliverCapture(client: ConvexClient, draft: CaptureDraft) {
    try {
        await sendCapture(client, draft);
        toast.info('Фото отправлено на разбор');
    } catch (error) {
        console.error('Failed to send the photo capture:', error);
        await keepUnsentCapture(draft);
        await refreshUnsentCaptures();
        toast.error(
            isRateLimited(error)
                ? 'Лимит фото на этот час исчерпан. Фото сохранено в «На проверке»'
                : 'Не удалось отправить фото. Оно сохранено в «На проверке»',
        );
    }
}

// The rate limiter's own helper lives in its server entry point, which the browser shouldn't load.
function isRateLimited(error: unknown) {
    return error instanceof ConvexError && error.data?.kind === 'RateLimited';
}
