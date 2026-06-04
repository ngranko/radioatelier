export async function verifyNotionWebhookSignature(
    payload: string,
    signature: string,
    verificationToken: string,
) {
    const expected = await computeNotionWebhookSignature(payload, verificationToken);
    return timingSafeEqual(expected, signature);
}

export async function computeNotionWebhookSignature(payload: string, verificationToken: string) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(verificationToken),
        {
            name: 'HMAC',
            hash: 'SHA-256',
        },
        false,
        ['sign'],
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    return `sha256=${toHex(new Uint8Array(signature))}`;
}

function timingSafeEqual(left: string, right: string) {
    const leftBytes = new TextEncoder().encode(left);
    const rightBytes = new TextEncoder().encode(right);
    if (leftBytes.length !== rightBytes.length) {
        return false;
    }
    let mismatch = 0;
    for (let index = 0; index < leftBytes.length; index += 1) {
        mismatch |= leftBytes[index] ^ rightBytes[index];
    }
    return mismatch === 0;
}

function toHex(bytes: Uint8Array) {
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}
