import {readExifOrientation} from '$lib/utils/image/exif';
import {createCanvas, getContextOrThrow} from '$lib/utils/image/resizer/canvas';
import {buildResizePlan} from '$lib/utils/image/resizer/geometry';
import {createOutputFile, decodeImageFile, toBlobOrThrow} from '$lib/utils/image/resizer/io';
import {resolveOutputPolicy} from '$lib/utils/image/resizer/policy';
import {drawWithOrientation} from '$lib/utils/image/resizer/transform';
import type {
    ResizeImageDependencies,
    ResizeImageOptions,
    ResizeImageResult,
} from '$lib/utils/image/resizer/types';
import {DEFAULT_ORIENTATION} from '$lib/utils/image/resizer/types';

async function resolveManualOrientation(
    file: File,
    readOrientation: ResizeImageDependencies['readOrientation'],
): Promise<number> {
    if (file.type === 'image/jpeg' || file.type === 'image/pjpeg') {
        return readOrientation(file);
    }

    const head = new Uint8Array(await file.slice(0, 3).arrayBuffer());
    if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
        return readOrientation(file);
    }

    return DEFAULT_ORIENTATION;
}

function createDefaultDependencies(): ResizeImageDependencies {
    return {
        readOrientation: readExifOrientation,
        decodeImage: decodeImageFile,
        createCanvas,
        toBlob: toBlobOrThrow,
        now: () => Date.now(),
    };
}

export function createImageResizer(
    dependencies: ResizeImageDependencies = createDefaultDependencies(),
) {
    return async function resizeImageWithDependencies(
        file: File,
        options: ResizeImageOptions = {},
    ): Promise<ResizeImageResult> {
        const policy = resolveOutputPolicy(file, options);
        const image = await dependencies.decodeImage(file);

        try {
            const orientation = image.needsManualExif
                ? await resolveManualOrientation(file, dependencies.readOrientation)
                : DEFAULT_ORIENTATION;
            const plan = buildResizePlan({
                sourceWidth: image.width,
                sourceHeight: image.height,
                orientation,
                maxEdge: options.maxEdge,
            });

            const scaledCanvas = dependencies.createCanvas(
                plan.scaledSourceWidth,
                plan.scaledSourceHeight,
            );
            const scaledContext = getContextOrThrow(scaledCanvas);
            scaledContext.drawImage(
                image.source,
                0,
                0,
                plan.scaledSourceWidth,
                plan.scaledSourceHeight,
            );

            const outputCanvas = dependencies.createCanvas(plan.outputWidth, plan.outputHeight);
            const outputContext = getContextOrThrow(outputCanvas);
            drawWithOrientation(
                outputContext,
                scaledCanvas,
                orientation,
                plan.outputWidth,
                plan.outputHeight,
            );

            const blob = await dependencies.toBlob(outputCanvas, policy.type, policy.quality);
            return createOutputFile(blob, file.name, policy, dependencies.now());
        } finally {
            image.release?.();
        }
    };
}

export const resizeImage = createImageResizer();
