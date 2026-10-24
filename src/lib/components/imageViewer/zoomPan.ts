export type Point = {x: number; y: number};
export type Size = {width: number; height: number};

/** `scale` 1 is the image fitted into the stage; the offset is measured between their centres. */
export type View = Point & {scale: number};

/** The stage, and the image as laid out in it before any zoom. */
export type Frame = {stage: Size; image: Size; maxScale: number};

export const FIT_VIEW: View = {scale: 1, x: 0, y: 0};

const MIN_ZOOM_RANGE = 4;

/** Small images still get a useful range; large ones can always reach their own pixels. */
export function resolveMaxScale(naturalWidth: number, fittedWidth: number): number {
    return Math.max(MIN_ZOOM_RANGE, naturalWidth / fittedWidth);
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

/** Keeps an edge of the image from being dragged past the matching edge of the stage. */
function clampOffset(offset: number, imageLength: number, stageLength: number): number {
    const reach = Math.max(0, (imageLength - stageLength) / 2);
    return reach ? clamp(offset, -reach, reach) : 0;
}

export function clampView(view: View, frame: Frame): View {
    const scale = clamp(view.scale, 1, frame.maxScale);

    return {
        scale,
        x: clampOffset(view.x, frame.image.width * scale, frame.stage.width),
        y: clampOffset(view.y, frame.image.height * scale, frame.stage.height),
    };
}

/** Zooms while keeping the image point under `anchor` (measured from the stage centre) in place. */
export function zoomAround(view: View, scale: number, anchor: Point, frame: Frame): View {
    const nextScale = clamp(scale, 1, frame.maxScale);
    const ratio = nextScale / view.scale;

    return clampView(
        {
            scale: nextScale,
            x: anchor.x - (anchor.x - view.x) * ratio,
            y: anchor.y - (anchor.y - view.y) * ratio,
        },
        frame,
    );
}

export function panBy(view: View, delta: Point, frame: Frame): View {
    return clampView({...view, x: view.x + delta.x, y: view.y + delta.y}, frame);
}
