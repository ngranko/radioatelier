export const MAP_CLICK_DEBOUNCE_MS = 300;
export const RENDERER_CLICK_WINDOW_MS = 500;

export class MapClickTimeout {
    private id?: ReturnType<typeof setTimeout>;

    public get isPending(): boolean {
        return this.id !== undefined;
    }

    public replace(callback: () => void, delayMs: number): void {
        this.clear();
        const id = setTimeout(() => {
            if (this.id !== id) {
                return;
            }
            this.id = undefined;
            callback();
        }, delayMs);
        this.id = id;
    }

    public clear(): boolean {
        if (this.id === undefined) {
            return false;
        }
        clearTimeout(this.id);
        this.id = undefined;
        return true;
    }
}

export function takePairedRendererClick(lastInteraction: number | undefined, now: number): boolean {
    return lastInteraction !== undefined && now - lastInteraction < RENDERER_CLICK_WINDOW_MS;
}
