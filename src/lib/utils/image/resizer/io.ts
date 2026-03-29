import type {DecodedImage, OutputPolicy} from '$lib/utils/image/resizer/types';

export async function decodeImageFile(file: File): Promise<DecodedImage> {
    if (typeof createImageBitmap === 'function') {
        try {
            return await decodeImageBitmap(file);
        } catch (error) {
            console.warn('Falling back to HTML image decoding:', error);
        }
    }

    return decodeHtmlImage(file);
}

export function createOutputFile(
    blob: Blob,
    sourceName: string,
    policy: OutputPolicy,
    lastModified: number,
): File {
    const baseName = sourceName.replace(/\.[^.]+$/, '');
    const fileName = `${baseName}.${policy.extension}`;

    return new File([blob], fileName, {
        type: policy.type,
        lastModified,
    });
}

function readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve(event.target?.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Не удалось загрузить изображение'));
        image.src = src;
    });
}

async function decodeImageBitmap(file: File): Promise<DecodedImage> {
    const bitmap = await createImageBitmap(file, {imageOrientation: 'none'});
    return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
    };
}

async function decodeHtmlImage(file: File): Promise<DecodedImage> {
    const dataUrl = await readAsDataUrl(file);
    const image = await loadImage(dataUrl);
    image.style.imageOrientation = 'none';

    return {
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
    };
}

export function toBlobOrThrow(
    canvas: HTMLCanvasElement,
    type: string,
    quality: number,
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            blob => {
                if (!blob) {
                    reject(new Error('Не удалось создать файл после сжатия'));
                    return;
                }
                resolve(blob);
            },
            type,
            quality,
        );
    });
}
