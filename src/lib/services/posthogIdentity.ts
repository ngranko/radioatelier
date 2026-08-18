const {promise, resolve} = Promise.withResolvers<void>();

export function markIdentityReady() {
    resolve();
}

export function waitForIdentity(): Promise<void> {
    return promise;
}