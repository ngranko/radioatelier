import {
    DEFAULT_MAX_EDGE,
    DEFAULT_ORIENTATION,
    EXIF_ORIENTATION,
    type ResizeImageOptions,
    type ResizePlan,
} from '$lib/utils/image/resizer/types';

type BuildResizePlanInput = {
    sourceWidth: number;
    sourceHeight: number;
    orientation: number;
    maxEdge?: ResizeImageOptions['maxEdge'];
};

export function buildResizePlan({
    sourceWidth,
    sourceHeight,
    orientation = DEFAULT_ORIENTATION,
    maxEdge = DEFAULT_MAX_EDGE,
}: BuildResizePlanInput): ResizePlan {
    const rotated = isRotatedOrientation(orientation);
    const orientedWidth = rotated ? sourceHeight : sourceWidth;
    const orientedHeight = rotated ? sourceWidth : sourceHeight;
    const scaleFactor = calculateScaleFactor(orientedWidth, orientedHeight, maxEdge);

    const scaledSourceWidth = Math.max(1, Math.round(sourceWidth * scaleFactor));
    const scaledSourceHeight = Math.max(1, Math.round(sourceHeight * scaleFactor));

    return {
        scaledSourceWidth,
        scaledSourceHeight,
        outputWidth: rotated ? scaledSourceHeight : scaledSourceWidth,
        outputHeight: rotated ? scaledSourceWidth : scaledSourceHeight,
    };
}

function calculateScaleFactor(width: number, height: number, maxEdge: number): number {
    const longestEdge = Math.max(width, height, 1);
    return Math.min(maxEdge, longestEdge) / longestEdge;
}

function isRotatedOrientation(orientation: number): boolean {
    return orientation >= EXIF_ORIENTATION.TRANSPOSE && orientation <= EXIF_ORIENTATION.ROTATE_270;
}
