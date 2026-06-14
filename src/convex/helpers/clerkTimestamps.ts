export function clerkTimestamp(value: unknown): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return null;
    }

    // Clerk webhook timestamps are usually milliseconds; older payloads may use seconds.
    return value < 1_000_000_000_000 ? value * 1000 : value;
}
