import {EXIF_ORIENTATION} from '$lib/utils/image/resizer/types';

type Transform = [number, number, number, number, number, number];

const TRANSFORMS_BY_ORIENTATION: Record<number, (width: number, height: number) => Transform> = {
    [EXIF_ORIENTATION.NORMAL]: () => [1, 0, 0, 1, 0, 0],
    [EXIF_ORIENTATION.FLIP_HORIZONTAL]: width => [-1, 0, 0, 1, width, 0],
    [EXIF_ORIENTATION.ROTATE_180]: (width, height) => [-1, 0, 0, -1, width, height],
    [EXIF_ORIENTATION.FLIP_VERTICAL]: (_, height) => [1, 0, 0, -1, 0, height],
    [EXIF_ORIENTATION.TRANSPOSE]: () => [0, 1, 1, 0, 0, 0],
    [EXIF_ORIENTATION.ROTATE_90]: width => [0, 1, -1, 0, width, 0],
    [EXIF_ORIENTATION.TRANSVERSE]: (width, height) => [0, -1, -1, 0, width, height],
    [EXIF_ORIENTATION.ROTATE_270]: (_, height) => [0, -1, 1, 0, 0, height],
};

export function drawWithOrientation(
    context: CanvasRenderingContext2D,
    image: CanvasImageSource,
    orientation: number,
    canvasWidth: number,
    canvasHeight: number,
) {
    context.save();

    const transformFactory =
        TRANSFORMS_BY_ORIENTATION[orientation] ??
        TRANSFORMS_BY_ORIENTATION[EXIF_ORIENTATION.NORMAL];
    const transform = transformFactory(canvasWidth, canvasHeight);
    context.setTransform(...transform);
    context.drawImage(image, 0, 0);

    context.restore();
}
