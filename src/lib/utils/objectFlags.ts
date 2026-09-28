export interface FlagValues {
    isPublic: boolean;
    isVisited: boolean;
    isRemoved: boolean;
}

export function hasAnyFlag({isPublic, isVisited, isRemoved}: FlagValues): boolean {
    return isPublic || isVisited || isRemoved;
}
