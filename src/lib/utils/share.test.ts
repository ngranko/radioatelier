import {describe, expect, it, vi} from 'vitest';
import {shareLink} from './share';

function stubNavigator(overrides: {share?: unknown; writeText?: unknown}) {
    const share = overrides.share as Navigator['share'] | undefined;
    const writeText = overrides.writeText as Clipboard['writeText'];

    vi.stubGlobal('navigator', {share, clipboard: {writeText}});
}

describe('shareLink', () => {
    it('hands the link to the share sheet when there is one', async () => {
        const share = vi.fn().mockResolvedValue(undefined);
        stubNavigator({share, writeText: vi.fn()});

        await expect(shareLink({url: 'https://ra.test/object/1', title: 'Вывеска'})).resolves.toBe(
            'shared',
        );
        expect(share).toHaveBeenCalledWith({url: 'https://ra.test/object/1', title: 'Вывеска'});
    });

    it('copies the link when there is no share sheet', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        stubNavigator({share: undefined, writeText});

        await expect(shareLink({url: 'https://ra.test/object/1'})).resolves.toBe('copied');
        expect(writeText).toHaveBeenCalledWith('https://ra.test/object/1');
    });

    it('leaves the clipboard alone when the user dismisses the share sheet', async () => {
        const abort = new Error('cancelled');
        abort.name = 'AbortError';
        const writeText = vi.fn();
        stubNavigator({share: vi.fn().mockRejectedValue(abort), writeText});

        await expect(shareLink({url: 'https://ra.test/object/1'})).resolves.toBe('dismissed');
        expect(writeText).not.toHaveBeenCalled();
    });

    it('falls back to the clipboard when the share sheet fails', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        stubNavigator({share: vi.fn().mockRejectedValue(new Error('no transport')), writeText});

        await expect(shareLink({url: 'https://ra.test/object/1'})).resolves.toBe('copied');
        expect(writeText).toHaveBeenCalled();
    });

    it('reports a failure when the clipboard is unavailable too', async () => {
        stubNavigator({
            share: undefined,
            writeText: vi.fn().mockRejectedValue(new Error('denied')),
        });

        await expect(shareLink({url: 'https://ra.test/object/1'})).resolves.toBe('failed');
    });
});
