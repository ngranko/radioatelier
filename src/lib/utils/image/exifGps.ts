import {
    type ExifTiff,
    findIfdEntry,
    hasBytes,
    IFD_ENTRY_VALUE_OFFSET,
    locateExifTiff,
    readFirstIfdOffset,
} from '$lib/utils/image/exif';

const GPS_IFD_POINTER_TAG = 0x8825;
const GPS_LATITUDE_REF_TAG = 0x0001;
const GPS_LATITUDE_TAG = 0x0002;
const GPS_LONGITUDE_REF_TAG = 0x0003;
const GPS_LONGITUDE_TAG = 0x0004;
const RATIONAL_SIZE = 8;

export interface ExifCoordinates {
    latitude: number;
    longitude: number;
}

export async function readExifCoordinates(file: File): Promise<ExifCoordinates | null> {
    const tiff = await locateExifTiff(file);
    const pointer = tiff && findIfdEntry(tiff, readFirstIfdOffset(tiff), GPS_IFD_POINTER_TAG);
    if (!tiff || pointer === null) {
        return null;
    }
    const gpsIfd = tiff.offset + readEntryUint32(tiff, pointer);
    const latitude = readSignedDegrees(tiff, gpsIfd, GPS_LATITUDE_TAG, GPS_LATITUDE_REF_TAG, 'S');
    const longitude = readSignedDegrees(
        tiff,
        gpsIfd,
        GPS_LONGITUDE_TAG,
        GPS_LONGITUDE_REF_TAG,
        'W',
    );
    // Cameras without a fix write zeros rather than leaving the tags out.
    if (latitude === null || longitude === null || (latitude === 0 && longitude === 0)) {
        return null;
    }
    return {latitude, longitude};
}

function readSignedDegrees(
    tiff: ExifTiff,
    gpsIfd: number,
    valueTag: number,
    refTag: number,
    negativeRef: string,
): number | null {
    const valueEntry = findIfdEntry(tiff, gpsIfd, valueTag);
    const refEntry = findIfdEntry(tiff, gpsIfd, refTag);
    if (valueEntry === null || refEntry === null) {
        return null;
    }
    const parts = readRationals(tiff, tiff.offset + readEntryUint32(tiff, valueEntry), 3);
    if (!parts) {
        return null;
    }
    const [degrees, minutes, seconds] = parts;
    const value = degrees + minutes / 60 + seconds / 3600;
    const ref = String.fromCharCode(tiff.data.getUint8(refEntry + IFD_ENTRY_VALUE_OFFSET));
    return ref === negativeRef ? -value : value;
}

function readRationals(tiff: ExifTiff, offset: number, count: number): number[] | null {
    if (!hasBytes(tiff.data, offset, count * RATIONAL_SIZE, tiff.limit)) {
        return null;
    }
    const values: number[] = [];
    for (let index = 0; index < count; index += 1) {
        const numerator = tiff.data.getUint32(offset + index * RATIONAL_SIZE, tiff.littleEndian);
        const denominator = tiff.data.getUint32(
            offset + index * RATIONAL_SIZE + 4,
            tiff.littleEndian,
        );
        if (denominator === 0) {
            return null;
        }
        values.push(numerator / denominator);
    }
    return values;
}

function readEntryUint32(tiff: ExifTiff, entry: number): number {
    return tiff.data.getUint32(entry + IFD_ENTRY_VALUE_OFFSET, tiff.littleEndian);
}
