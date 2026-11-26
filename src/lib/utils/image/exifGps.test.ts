import {describe, expect, it} from 'vitest';
import {readExifCoordinates} from './exifGps';

const TIFF_SIZE = 128;

// A big-endian TIFF whose IFD0 points at a GPS IFD with 55°45'36" N, 37°37'0" W.
function buildJpegWithGps(): File {
    const tiff = new DataView(new ArrayBuffer(TIFF_SIZE));
    tiff.setUint16(0, 0x4d4d);
    tiff.setUint16(2, 0x002a);
    tiff.setUint32(4, 8);
    tiff.setUint16(8, 1);
    writeEntry(tiff, 10, 0x8825, 4, 1, 26);
    tiff.setUint16(26, 4);
    writeEntry(tiff, 28, 0x0001, 2, 2, 0x4e000000);
    writeEntry(tiff, 40, 0x0002, 5, 3, 80);
    writeEntry(tiff, 52, 0x0003, 2, 2, 0x57000000);
    writeEntry(tiff, 64, 0x0004, 5, 3, 104);
    [55, 45, 36, 37, 37, 0].forEach((value, index) => {
        tiff.setUint32(80 + index * 8, value);
        tiff.setUint32(84 + index * 8, 1);
    });

    const header = [0xff, 0xd8, 0xff, 0xe1, 0x00, 2 + 6 + TIFF_SIZE, 0x45, 0x78, 0x69, 0x66, 0, 0];
    const bytes = [...header, ...new Uint8Array(tiff.buffer), 0xff, 0xd9];
    return new File([new Uint8Array(bytes)], 'photo.jpg', {type: 'image/jpeg'});
}

function writeEntry(
    view: DataView,
    offset: number,
    tag: number,
    type: number,
    count: number,
    value: number,
) {
    view.setUint16(offset, tag);
    view.setUint16(offset + 2, type);
    view.setUint32(offset + 4, count);
    view.setUint32(offset + 8, value);
}

describe('readExifCoordinates', () => {
    it('converts the GPS rationals to signed decimal degrees', async () => {
        const coordinates = await readExifCoordinates(buildJpegWithGps());

        expect(coordinates?.latitude).toBeCloseTo(55.76, 5);
        expect(coordinates?.longitude).toBeCloseTo(-37.616667, 5);
    });
});
