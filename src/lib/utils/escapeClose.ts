type EscapeCloseHandler = {
    priority: number;
    isActive: () => boolean;
    close: () => void;
};

const handlers: EscapeCloseHandler[] = [];

const OPEN_FLOATING_LAYER_SELECTOR = [
    '[data-state="open"][data-slot="dialog-content"]',
    '[data-state="open"][data-slot="alert-dialog-content"]',
    '[data-state="open"][data-slot="popover-content"]',
    '[data-state="open"][data-slot="dropdown-menu-content"]',
    '[data-state="open"][data-slot="select-content"]',
    '[data-state="open"][data-slot="dropdown-menu-sub-content"]',
].join(', ');

function hasOpenFloatingLayer(): boolean {
    return document.querySelector(OPEN_FLOATING_LAYER_SELECTOR) !== null;
}

export function registerEscapeCloseHandler(handler: EscapeCloseHandler): () => void {
    handlers.push(handler);
    handlers.sort((a, b) => b.priority - a.priority);

    return () => {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
            handlers.splice(index, 1);
        }
    };
}

export function dispatchEscapeClose(): boolean {
    if (hasOpenFloatingLayer()) {
        return false;
    }

    for (const handler of handlers) {
        if (handler.isActive()) {
            handler.close();
            return true;
        }
    }

    return false;
}
