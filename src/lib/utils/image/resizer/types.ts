export const DEFAULT_ORIENTATION = 1;
export const DEFAULT_MAX_EDGE = 1024;
export const DEFAULT_QUALITY = 1;

export const EXIF_ORIENTATION = {
    NORMAL: 1,
    FLIP_HORIZONTAL: 2,
    ROTATE_180: 3,
    FLIP_VERTICAL: 4,
    TRANSPOSE: 5,
    ROTATE_90: 6,
    TRANSVERSE: 7,
    ROTATE_270: 8,
} as const;

export type OutputImageType = 'image/jpeg' | 'image/png' | 'image/webp';

export type ResizeImageOptions = {
    maxEdge?: number;
    quality?: number;
    outputType?: OutputImageType;
};

export type OutputPolicy = {
    type: OutputImageType;
    extension: 'jpg' | 'png' | 'webp';
    quality: number;
};

export type ResizePlan = {
    scaledSourceWidth: number;
    scaledSourceHeight: number;
    outputWidth: number;
    outputHeight: number;
};

export type DecodedImage = {
    source: CanvasImageSource;
    width: number;
    height: number;
    release?: () => void;
};

export type ResizeImageDependencies = {
    readOrientation: (file: File) => Promise<number>;
    decodeImage: (file: File) => Promise<DecodedImage>;
    createCanvas: (width: number, height: number) => HTMLCanvasElement;
    toBlob: (canvas: HTMLCanvasElement, type: string, quality: number) => Promise<Blob>;
    now: () => number;
};

export type ResizeImageResult = File;
