import {afterEach, describe, expect, it, vi} from 'vitest';
import {shareLink} from './share';

function stubNavigator(overrides: {
    share?: unknown;
    writeText?: unknown;
    userAgent?: string;
    maxTouchPoints?: number;
}) {
    const share = overrides.share as Navigator['share'] | undefined;
    const writeText = overrides.writeText as Clipboard['writeText'];

    vi.stubGlobal('navigator', {
        share,
        clipboard: {writeText},
        userAgent: overrides.userAgent ?? 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
        maxTouchPoints: overrides.maxTouchPoints ?? 0,
    });
}

afterEach(() => vi.unstubAllGlobals());

describe('shareLink', () => {
    it.each([
        [
            'Mac Safari',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15',
            0,
            'copied',
        ],
        [
            'Mac Chrome',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/140.0.0.0 Safari/537.36',
            0,
            'copied',
        ],
        [
            'Windows touchscreen',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0.0.0',
            10,
            'copied',
        ],
        ['Linux', 'Mozilla/5.0 (X11; Linux x86_64) Firefox/140.0', 0, 'copied'],
        ['iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', 5, 'shared'],
        ['iPad', 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)', 5, 'shared'],
        ['iPad desktop mode', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5, 'shared'],
        ['Android phone', 'Mozilla/5.0 (Linux; Android 15; Pixel 9) Mobile', 5, 'shared'],
        ['Android tablet', 'Mozilla/5.0 (Linux; Android 15; Pixel Tablet)', 5, 'shared'],
        ['unknown browser', '', 0, 'copied'],
    ])(
        'chooses the expected sharing path on %s',
        async (_name, userAgent, maxTouchPoints, outcome) => {
            const share = vi.fn().mockResolvedValue(undefined);
            const writeText = vi.fn().mockResolvedValue(undefined);
            stubNavigator({share, writeText, userAgent, maxTouchPoints});

            await expect(shareLink({url: 'https://ra.test/object/1'})).resolves.toBe(outcome);
            expect(share).toHaveBeenCalledTimes(outcome === 'shared' ? 1 : 0);
            expect(writeText).toHaveBeenCalledTimes(outcome === 'copied' ? 1 : 0);
        },
    );

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

    it('reports a failure when neither browser API exists', async () => {
        vi.stubGlobal('navigator', {userAgent: '', maxTouchPoints: 0});

        await expect(shareLink({url: 'https://ra.test/object/1'})).resolves.toBe('failed');
    });
});
