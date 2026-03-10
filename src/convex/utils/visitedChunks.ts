const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

function fnv1aHash(input: string): string {
    let hash = FNV_OFFSET_BASIS;
    for (let i = 0; i < input.length; i += 1) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, FNV_PRIME) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
}

export function getVisitedChunkId(objectId: string): string {
    return fnv1aHash(objectId).slice(0, 3);
}
