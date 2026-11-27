import {api} from '$convex/_generated/api';
import {uploadImage} from '$lib/services/imageUpload';
import type {ConvexClient} from 'convex/browser';
import type {CaptureDraft} from './unsentCaptures';

type CaptureClient = Pick<ConvexClient, 'mutation' | 'action'>;

// Unsent captures carry local bookkeeping too, so the fields are picked rather than spread.
export async function sendCapture(client: CaptureClient, draft: CaptureDraft) {
    const uploaded = await uploadImage(client, draft.image);
    const {latitude, longitude, address, city, country} = draft;
    await client.mutation(api.photoCaptures.create, {
        imageId: uploaded.id,
        latitude,
        longitude,
        address,
        city,
        country,
    });
}

// The address only helps the analysis and the review, so a failed lookup costs
// the capture nothing.
export async function describeCapturePlace(
    client: CaptureClient,
    coordinates: {latitude: number; longitude: number},
) {
    try {
        return await client.action(api.locations.getAddress, coordinates);
    } catch (error) {
        console.error('Failed to look up the capture address:', error);
        return {address: null, city: null, country: null};
    }
}
