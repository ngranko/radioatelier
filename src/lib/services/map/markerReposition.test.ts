import {beforeEach, describe, expect, it, vi} from 'vitest';
import {saveReposition} from './markerReposition';

const toast = vi.hoisted(() => ({
    loading: vi.fn(() => 'toast-id'),
    success: vi.fn(),
    error: vi.fn(),
}));

vi.mock('svelte-sonner', () => ({toast}));

const origin = {lat: 1, lng: 2};
const dragged = {lat: 3, lng: 4};
const draggedAgain = {lat: 5, lng: 6};

function request(save: (position: {lat: number; lng: number}) => Promise<void>) {
    const moveTo = vi.fn();
    return {request: {position: dragged, origin, save, moveTo}, moveTo};
}

function takeUndoAction() {
    const options = toast.success.mock.calls[0]?.[1] as {
        action?: {label: string; onClick(): void};
    };
    return options.action;
}

describe('saveReposition', () => {
    beforeEach(() => vi.clearAllMocks());

    it('offers the way back once the new position is stored', async () => {
        const save = vi.fn(async () => {});
        const {request: req} = request(save);

        await saveReposition(req);

        expect(save).toHaveBeenCalledWith(dragged);
        expect(takeUndoAction()?.label).toBeTruthy();
    });

    it('puts the marker back where it started when the undo is used', async () => {
        const save = vi.fn(async () => {});
        const {request: req, moveTo} = request(save);

        await saveReposition(req);
        takeUndoAction()?.onClick();
        await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(2));

        expect(moveTo).toHaveBeenCalledWith(origin);
        expect(save).toHaveBeenLastCalledWith(origin);
    });

    it('leaves no undo when the marker had no known origin', async () => {
        const {request: req} = request(vi.fn(async () => {}));

        await saveReposition({...req, origin: undefined});

        expect(takeUndoAction()).toBeUndefined();
    });

    it('returns the marker to its origin when the save is rejected', async () => {
        const save = vi.fn(async () => {
            throw new Error('nope');
        });
        const {request: req, moveTo} = request(save);
        vi.spyOn(console, 'error').mockImplementation(() => {});

        await saveReposition(req);

        expect(moveTo).toHaveBeenCalledWith(origin);
        expect(toast.error).toHaveBeenCalled();
    });

    it('does not roll back a newer drag when an earlier save is rejected', async () => {
        let rejectEarlier!: (reason: Error) => void;
        const save = vi
            .fn<(position: typeof dragged) => Promise<void>>()
            .mockImplementationOnce(() => new Promise((_, reject) => (rejectEarlier = reject)))
            .mockResolvedValueOnce();
        const moveTo = vi.fn();
        vi.spyOn(console, 'error').mockImplementation(() => {});

        const earlier = saveReposition({position: dragged, origin, save, moveTo});
        const later = saveReposition({position: draggedAgain, origin: dragged, save, moveTo});
        rejectEarlier(new Error('older save failed'));
        await Promise.all([earlier, later]);

        expect(moveTo).not.toHaveBeenCalled();
    });
});
