import {GoogleMapsProvider} from '$lib/services/map/providers/google/provider';
import {mapState} from '$lib/state/map.svelte';
import {setOverlayPosition} from '$lib/state/objectDetailsOverlay.svelte';

let streetViewService: google.maps.StreetViewService | null = null;
const lookupCache: Record<string, google.maps.StreetViewLocation | undefined> = {};
const failureCache: Record<string, {error: unknown; expiresAt: number} | undefined> = {};
const pendingLookups: Record<string, Promise<google.maps.StreetViewLocation> | undefined> = {};

const LOOKUP_CACHE_PRECISION = 4;
const FAILURE_CACHE_MS = 5 * 60 * 1000;
const RATE_LIMIT_COOLDOWN_MS = 60 * 1000;

let rateLimitCooldownUntil = 0;

function getStreetViewService() {
    streetViewService ??= new google.maps.StreetViewService();
    return streetViewService;
}

function cacheKey(lat: number, lng: number) {
    return `${lat.toFixed(LOOKUP_CACHE_PRECISION)},${lng.toFixed(LOOKUP_CACHE_PRECISION)}`;
}

function createRateLimitError() {
    return new Error('Street View requests are temporarily rate-limited (429)');
}

function getErrorText(error: unknown) {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    try {
        return JSON.stringify(error);
    } catch {
        return String(error);
    }
}

function isRateLimitError(error: unknown) {
    const message = getErrorText(error).toLowerCase();
    return (
        message.includes('429') ||
        message.includes('over_query_limit') ||
        message.includes('resource_exhausted')
    );
}

async function runStreetViewLookup(lat: number, lng: number) {
    if (Date.now() < rateLimitCooldownUntil) {
        throw createRateLimitError();
    }

    try {
        const streetView = await getStreetViewService().getPanorama({
            location: new google.maps.LatLng(lat, lng),
            radius: 30,
        });
        return streetView.data.location!;
    } catch (error) {
        if (isRateLimitError(error)) {
            rateLimitCooldownUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
        }
        throw error;
    }
}

export function applyStreetViewLocation(
    panorama: google.maps.StreetViewPanorama,
    location: google.maps.StreetViewLocation,
) {
    if (location.pano) {
        if (panorama.getPano() !== location.pano) {
            panorama.setPano(location.pano);
        }
    } else if (location.latLng) {
        panorama.setPosition(location.latLng);
    } else {
        throw new Error('Invalid street view location');
    }

    panorama.setVisible(true);
}

export async function resolveStreetViewLocation(lat: number, lng: number) {
    const key = cacheKey(lat, lng);
    const cachedLocation = lookupCache[key];
    if (cachedLocation) {
        return cachedLocation;
    }

    const cachedFailure = failureCache[key];
    if (cachedFailure) {
        if (cachedFailure.expiresAt > Date.now()) {
            throw cachedFailure.error;
        }
        delete failureCache[key];
    }

    const pendingLookup = pendingLookups[key];
    if (pendingLookup) {
        return pendingLookup;
    }

    const lookup = runStreetViewLookup(lat, lng)
        .then(location => {
            lookupCache[key] = location;
            return location;
        })
        .catch(error => {
            const cacheMs = isRateLimitError(error) ? RATE_LIMIT_COOLDOWN_MS : FAILURE_CACHE_MS;
            failureCache[key] = {
                error,
                expiresAt: Date.now() + cacheMs,
            };
            throw error;
        })
        .finally(() => {
            delete pendingLookups[key];
        });

    pendingLookups[key] = lookup;
    return lookup;
}

export function getStreetView(lat: number, lng: number) {
    const provider = mapState.provider;
    if (!(provider instanceof GoogleMapsProvider)) {
        return Promise.reject(new Error('Google Maps provider not available'));
    }

    const googleMap = provider.getGoogleMap();
    if (!googleMap) {
        return Promise.reject(new Error('Map not initialized'));
    }

    return resolveStreetViewLocation(lat, lng).then(location => {
        const pano = googleMap.getStreetView();
        applyStreetViewLocation(pano, location);
        setOverlayPosition('minimized');
    });
}
