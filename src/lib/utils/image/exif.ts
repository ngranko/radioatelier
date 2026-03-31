const DEFAULT_ORIENTATION = 1;

const MARKER_SIZE = 2;
const SEGMENT_LENGTH_SIZE = 2;
const IFD_ENTRY_SIZE = 12;
const IFD_ENTRY_VALUE_OFFSET = 8;
const TIFF_HEADER_SIZE = 8;
const EXIF_IDENTIFIER_SIZE = 6;

const JPEG_SOI_MARKER = 0xffd8;
const EXIF_APP1_MARKER = 0xffe1;
const MARKER_PREFIX_MASK = 0xff00;
const MARKER_PREFIX = 0xff00;
const TIFF_LITTLE_ENDIAN_MARKER = 0x4949;
const EXIF_HEADER_MAGIC = 0x45786966;
const ORIENTATION_TAG = 0x0112;

export async function readExifOrientation(file: File): Promise<number> {
    const data = new DataView(await file.arrayBuffer());
    if (!isJpeg(data)) {
        return DEFAULT_ORIENTATION;
    }

    const exifSegmentOffset = findExifSegmentOffset(data);
    if (exifSegmentOffset === null) {
        return DEFAULT_ORIENTATION;
    }

    return readOrientationFromExifSegment(data, exifSegmentOffset) ?? DEFAULT_ORIENTATION;
}

function isJpeg(data: DataView): boolean {
    return hasBytes(data, 0, MARKER_SIZE) && data.getUint16(0, false) === JPEG_SOI_MARKER;
}

function findExifSegmentOffset(data: DataView): number | null {
    let offset = MARKER_SIZE;

    while (hasBytes(data, offset, MARKER_SIZE)) {
        const marker = data.getUint16(offset, false);
        offset += MARKER_SIZE;

        if (
            (marker & MARKER_PREFIX_MASK) !== MARKER_PREFIX ||
            !hasBytes(data, offset, SEGMENT_LENGTH_SIZE)
        ) {
            return null;
        }

        const segmentLength = data.getUint16(offset, false);
        if (segmentLength < SEGMENT_LENGTH_SIZE) {
            return null;
        }

        if (marker === EXIF_APP1_MARKER && hasExifHeader(data, offset + SEGMENT_LENGTH_SIZE)) {
            return offset;
        }

        offset += segmentLength;
    }

    return null;
}

function hasExifHeader(data: DataView, offset: number): boolean {
    return (
        hasBytes(data, offset, EXIF_IDENTIFIER_SIZE) &&
        data.getUint32(offset, false) === EXIF_HEADER_MAGIC
    );
}

function readOrientationFromExifSegment(data: DataView, segmentOffset: number): number | null {
    if (!hasBytes(data, segmentOffset, SEGMENT_LENGTH_SIZE + EXIF_IDENTIFIER_SIZE)) {
        return null;
    }

    const segmentLength = data.getUint16(segmentOffset, false);
    const segmentEnd = segmentOffset + segmentLength;
    if (segmentEnd > data.byteLength) {
        return null;
    }

    const exifHeaderOffset = segmentOffset + SEGMENT_LENGTH_SIZE;
    if (!hasBytes(data, exifHeaderOffset, 4, segmentEnd)) {
        return null;
    }
    if (data.getUint32(exifHeaderOffset, false) !== EXIF_HEADER_MAGIC) {
        return null;
    }

    const tiffOffset = exifHeaderOffset + EXIF_IDENTIFIER_SIZE;
    if (!hasBytes(data, tiffOffset, TIFF_HEADER_SIZE, segmentEnd)) {
        return null;
    }

    return readOrientationFromTiff(data, tiffOffset, segmentEnd);
}

function readOrientationFromTiff(data: DataView, tiffOffset: number, limit: number): number | null {
    const littleEndian = data.getUint16(tiffOffset, false) === TIFF_LITTLE_ENDIAN_MARKER;

    const firstIfdOffset = data.getUint32(tiffOffset + 4, littleEndian);
    const ifdOffset = tiffOffset + firstIfdOffset;
    if (!hasBytes(data, ifdOffset, 2, limit)) {
        return null;
    }

    const entryCount = data.getUint16(ifdOffset, littleEndian);
    const firstEntryOffset = ifdOffset + 2;

    for (let index = 0; index < entryCount; index += 1) {
        const entryOffset = firstEntryOffset + index * IFD_ENTRY_SIZE;
        if (!hasBytes(data, entryOffset, IFD_ENTRY_SIZE, limit)) {
            return null;
        }

        const tag = data.getUint16(entryOffset, littleEndian);
        if (tag === ORIENTATION_TAG) {
            return data.getUint16(entryOffset + IFD_ENTRY_VALUE_OFFSET, littleEndian);
        }
    }

    return null;
}

function hasBytes(
    data: DataView,
    offset: number,
    length: number,
    limit = data.byteLength,
): boolean {
    return offset >= 0 && length >= 0 && offset + length <= limit;
}
