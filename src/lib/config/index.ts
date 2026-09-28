import {PUBLIC_GOOGLE_MAPS_API_KEY, PUBLIC_GOOGLE_MAPS_MAP_ID} from '$env/static/public';

function requirePublicEnv(value: string | undefined, name: string) {
    const trimmed = value?.trim();
    if (!trimmed) {
        throw new Error(`Missing ${name} environment variable`);
    }
    return trimmed;
}

// Getters, so a missing key fails where Maps is used rather than on import,
// which would break every module (and test) that merely imports the config.
export default {
    get googleMapsApiKey() {
        return requirePublicEnv(PUBLIC_GOOGLE_MAPS_API_KEY, 'PUBLIC_GOOGLE_MAPS_API_KEY');
    },
    get googleMapsId() {
        return requirePublicEnv(PUBLIC_GOOGLE_MAPS_MAP_ID, 'PUBLIC_GOOGLE_MAPS_MAP_ID');
    },
    deckZoomThreshold: 10,
};
