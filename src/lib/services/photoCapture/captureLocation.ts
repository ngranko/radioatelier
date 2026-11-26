import {readRecentPosition} from '$lib/services/map/geolocation';
import {requestCapturePin} from '$lib/state/photoCapture.svelte';
import {readExifCoordinates} from '$lib/utils/image/exifGps';

// A photo this young was taken where the phone still is.
const FRESH_PHOTO_MS = 10 * 60 * 1000;
const RECENT_POSITION_MS = 2 * 60 * 1000;

export type CaptureLocationSource = 'exif' | 'device' | 'pin';

export interface CaptureLocation {
    latitude: number;
    longitude: number;
    source: CaptureLocationSource;
}

export async function resolveCaptureLocation(file: File): Promise<CaptureLocation | null> {
    const exif = await readExifCoordinates(file);
    if (exif) {
        return {...exif, source: 'exif'};
    }
    const device =
        Date.now() - file.lastModified <= FRESH_PHOTO_MS
            ? readRecentPosition(RECENT_POSITION_MS)
            : null;
    if (device) {
        return {latitude: device.lat, longitude: device.lng, source: 'device'};
    }
    const pin = await requestCapturePin();
    return pin && {latitude: pin.lat, longitude: pin.lng, source: 'pin'};
}
