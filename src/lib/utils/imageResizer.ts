import {readExifOrientation} from '$lib/utils/image/exif';
import {createCanvas, getContextOrThrow} from '$lib/utils/image/resizer/canvas';
import {buildResizePlan} from '$lib/utils/image/resizer/geometry';
import {createOutputFile, decodeImageFile, toBlobOrThrow} from '$lib/utils/image/resizer/io';
import {resolveOutputPolicy} from '$lib/utils/image/resizer/policy';
import {drawWithOrientation} from '$lib/utils/image/resizer/transform';
import type {
    DecodedImage,
    OutputPolicy,
    ResizeImageDependencies,
    ResizeImageOptions,
    ResizeImageResult,
    ResizePlan,
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

function buildAndScaleCanvas(
    dependencies: ResizeImageDependencies,
    plan: ResizePlan,
    source: CanvasImageSource,
): HTMLCanvasElement {
    const scaledCanvas = dependencies.createCanvas(plan.scaledSourceWidth, plan.scaledSourceHeight);
    const scaledContext = getContextOrThrow(scaledCanvas);
    scaledContext.drawImage(source, 0, 0, plan.scaledSourceWidth, plan.scaledSourceHeight);
    return scaledCanvas;
}

async function renderAndEncode(
    dependencies: ResizeImageDependencies,
    policy: OutputPolicy,
    scaledCanvas: HTMLCanvasElement,
    orientation: number,
    plan: ResizePlan,
    sourceName: string,
): Promise<ResizeImageResult> {
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
    return createOutputFile(blob, sourceName, policy, dependencies.now());
}

export function createImageResizer(
    dependencies: ResizeImageDependencies = createDefaultDependencies(),
) {
    return async function resizeImageWithDependencies(
        file: File,
        options: ResizeImageOptions = {},
    ): Promise<ResizeImageResult> {
        const policy = resolveOutputPolicy(file, options);
        const image: DecodedImage = await dependencies.decodeImage(file);

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

            const scaledCanvas = buildAndScaleCanvas(dependencies, plan, image.source);
            return await renderAndEncode(
                dependencies,
                policy,
                scaledCanvas,
                orientation,
                plan,
                file.name,
            );
        } finally {
            image.release?.();
        }
    };
}

export const resizeImage = createImageResizer();
