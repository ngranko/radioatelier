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
            const orientation =
                file.type === 'image/jpeg'
                    ? await dependencies.readOrientation(file)
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
