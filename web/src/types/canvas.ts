export type Point = [number, number];
export type DrawFn = (ctx: CanvasRenderingContext2D) => void;
export type CanvasContext = {
    addDrawFn: (fn: DrawFn) => void;
    removeDrawFn: (fn: DrawFn) => void;
    getAnimatedValue: (animationFraming: AnimationFraming) => number;
};

export interface AnimationPoint {
    t: number;
    o: number;
}
export type AnimationFraming = AnimationPoint[];
