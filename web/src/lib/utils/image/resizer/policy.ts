import {
    DEFAULT_QUALITY,
    type OutputImageType,
    type OutputPolicy,
    type ResizeImageOptions,
} from '$lib/utils/image/resizer/types';

const SUPPORTED_TYPES: ReadonlySet<string> = new Set(['image/jpeg', 'image/png', 'image/webp']);

const TYPE_TO_EXTENSION: Record<OutputImageType, OutputPolicy['extension']> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
};

export function resolveOutputPolicy(file: File, options: ResizeImageOptions): OutputPolicy {
    const type = resolveOutputType(file, options);
    return {
        type,
        extension: TYPE_TO_EXTENSION[type],
        quality: normalizeQuality(options.quality),
    };
}

function resolveOutputType(file: File, options: ResizeImageOptions): OutputImageType {
    if (options.outputType) {
        return options.outputType;
    }

    if (isSupportedOutputType(file.type)) {
        return file.type as OutputImageType;
    }

    return 'image/jpeg';
}

function isSupportedOutputType(type: string): boolean {
    return SUPPORTED_TYPES.has(type);
}

function normalizeQuality(value: number | undefined): number {
    if (value === undefined) {
        return DEFAULT_QUALITY;
    }

    return Math.max(0, Math.min(1, value));
}
