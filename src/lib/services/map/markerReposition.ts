import type {LatLngLiteral} from '$lib/interfaces/map';
import {toast} from 'svelte-sonner';

interface RepositionRequest {
    position: LatLngLiteral;
    /** Where the marker sat before the drag, when it is known; the undo goes back to it. */
    origin?: LatLngLiteral;
    save: (position: LatLngLiteral) => Promise<void>;
    moveTo(position: LatLngLiteral): void;
}

interface UndoAction {
    label: string;
    onClick(): void;
}

interface Feedback {
    loading: string;
    success: string;
    error: string;
}

// A hold can still be triggered by accident, so the undo has to stay reachable longer than the
// default toast lifetime.
const UNDO_TOAST_MS = 10000;

const SAVE_FEEDBACK: Feedback = {
    loading: 'Обновляю...',
    success: 'Позиция обновлена!',
    error: 'Не удалось обновить позицию',
};

const UNDO_FEEDBACK: Feedback = {
    loading: 'Возвращаю...',
    success: 'Позиция возвращена',
    error: 'Не удалось вернуть позицию',
};

// Drag requests are recreated, but their save callback stays stable for the life of the marker.
const latestAttempts = new WeakMap<RepositionRequest['save'], number>();

export async function saveReposition(request: RepositionRequest): Promise<void> {
    await persistPosition(request, {
        target: request.position,
        rollbackTo: request.origin,
        feedback: SAVE_FEEDBACK,
        action: buildUndoAction(request),
    });
}

function buildUndoAction(request: RepositionRequest): UndoAction | undefined {
    const {origin} = request;
    if (!origin) {
        return undefined;
    }

    return {label: 'Вернуть', onClick: () => void undoReposition(request, origin)};
}

function undoReposition(request: RepositionRequest, origin: LatLngLiteral): Promise<void> {
    request.moveTo(origin);
    return persistPosition(request, {
        target: origin,
        rollbackTo: request.position,
        feedback: UNDO_FEEDBACK,
    });
}

interface SaveAttempt {
    target: LatLngLiteral;
    /** The marker is moved before the server knows about it, so a rejected save has to undo that. */
    rollbackTo?: LatLngLiteral;
    feedback: Feedback;
    action?: UndoAction;
}

async function persistPosition(
    request: RepositionRequest,
    {target, rollbackTo, feedback, action}: SaveAttempt,
): Promise<void> {
    const attempt = (latestAttempts.get(request.save) ?? 0) + 1;
    latestAttempts.set(request.save, attempt);
    const toastId = toast.loading(feedback.loading);
    try {
        await request.save(target);
        toast.success(feedback.success, {
            id: toastId,
            action,
            duration: action ? UNDO_TOAST_MS : undefined,
        });
    } catch (error) {
        console.error(error);
        // A newer drag already moved the marker on; a stale failure must not yank it back.
        if (rollbackTo && latestAttempts.get(request.save) === attempt) {
            request.moveTo(rollbackTo);
        }
        toast.error(feedback.error, {id: toastId});
    }
}
