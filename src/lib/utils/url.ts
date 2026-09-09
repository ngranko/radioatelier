const SAFE_PROTOCOLS = ['http:', 'https:'];

// `javascript:` and `data:` parse as valid URLs, so anything that ends up in an
// `href` has to be checked by protocol rather than by URL validity alone.
export function isSafeExternalUrl(value: string | null | undefined): value is string {
    if (!value) {
        return false;
    }

    try {
        return SAFE_PROTOCOLS.includes(new URL(value).protocol);
    } catch {
        return false;
    }
}
