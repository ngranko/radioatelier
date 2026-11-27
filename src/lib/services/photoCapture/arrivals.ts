/**
 * Follows a live list and hands back the items that newly match since the previous snapshot.
 * The first snapshot only sets the baseline, so opening the app announces nothing.
 */
export function trackArrivals<T extends {id: string}>(matches: (item: T) => boolean = () => true) {
    let previous: Set<string> | null = null;
    return (items: T[]): T[] => {
        const matching = items.filter(matches);
        const arrived = previous ? matching.filter(item => !previous!.has(item.id)) : [];
        previous = new Set(matching.map(item => item.id));
        return arrived;
    };
}
