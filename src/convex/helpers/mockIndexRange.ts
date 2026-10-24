type Row = Record<string, unknown>;

export type IndexRange = {eq(field: string, value: unknown): IndexRange};

// Lets test doubles of `ctx.db` honour the `withIndex` range a query builds.
export function matchIndexRange(range: (q: IndexRange) => IndexRange) {
    const conditions: [string, unknown][] = [];
    const builder: IndexRange = {
        eq(field, value) {
            conditions.push([field, value]);
            return builder;
        },
    };
    range(builder);
    return (row: Row) => conditions.every(([field, value]) => row[field] === value);
}
