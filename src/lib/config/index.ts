import {PUBLIC_GOOGLE_MAPS_API_KEY, PUBLIC_GOOGLE_MAPS_MAP_ID} from '$env/static/public';

function requirePublicEnv(value: string | undefined, name: string) {
    const trimmed = value?.trim();
    if (!trimmed) {
        throw new Error(`Missing ${name} environment variable`);
    }
    return trimmed;
}

export default {
    googleMapsApiKey: requirePublicEnv(PUBLIC_GOOGLE_MAPS_API_KEY, 'PUBLIC_GOOGLE_MAPS_API_KEY'),
    googleMapsId: requirePublicEnv(PUBLIC_GOOGLE_MAPS_MAP_ID, 'PUBLIC_GOOGLE_MAPS_MAP_ID'),
    deckZoomThreshold: 10,
};
