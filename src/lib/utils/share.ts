interface ShareRequest {
    url: string;
    title?: string;
}

export type ShareOutcome = 'shared' | 'copied' | 'dismissed' | 'failed';

export async function shareLink({url, title}: ShareRequest): Promise<ShareOutcome> {
    if (navigator.share) {
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
