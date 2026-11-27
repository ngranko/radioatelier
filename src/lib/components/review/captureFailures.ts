// Only failures the owner can act on get a line of their own; the rest are ours to fix.
const HINTS: Record<string, string> = {
    key_rejected: 'OpenRouter отклонил ваш ключ',
    no_credits: 'На ключе OpenRouter закончились средства',
};

export function describeCaptureFailure(reason: string | null): string | null {
    return reason ? (HINTS[reason] ?? null) : null;
}

export function formatSentTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'});
}
