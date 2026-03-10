export function createCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

export function getContextOrThrow(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('Не удалось получить контекст');
    }

    return context;
}
