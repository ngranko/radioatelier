interface ShareRequest {
    url: string;
    title?: string;
}

export type ShareOutcome = 'shared' | 'copied' | 'dismissed' | 'failed';

export async function shareLink({url, title}: ShareRequest): Promise<ShareOutcome> {
    if (shouldUseNativeShare()) {
        try {
            await navigator.share({title, url});
            return 'shared';
        } catch (error) {
            // A share sheet reports a user-cancelled share as an abort; copying the link
            // there would put back a link the user just declined to send.
            if (isAbortError(error)) {
                return 'dismissed';
            }
        }
    }

    return copyLink(url);
}

function shouldUseNativeShare(): boolean {
    // Desktop share sheets cannot be anchored through the Web Share API.
    // iPadOS can identify as macOS, but Macs do not expose multitouch screens.
    const isMobile = /Android|iPhone|iPad|iPod/.test(navigator.userAgent);
    const isIPad = /Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1;
    return typeof navigator.share === 'function' && (isMobile || isIPad);
}

async function copyLink(url: string): Promise<ShareOutcome> {
    try {
        await navigator.clipboard.writeText(url);
        return 'copied';
    } catch {
        return 'failed';
    }
}

function isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === 'AbortError';
}
