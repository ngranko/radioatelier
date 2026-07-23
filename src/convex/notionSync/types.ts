import {v} from 'convex/values';

export type AppSyncFields = {
    name: string;
    categoryName: string;
    address: string | null;
    city: string | null;
    country: string | null;
    mapLink: string;
    internalId: string;
    installedPeriod: string | null;
    isRemoved: boolean;
    removalPeriod: string | null;
    tagNames: string[];
    isVisited: boolean;
    source: string | null;
};

export type AppSyncPatch = Partial<
    Omit<AppSyncFields, 'mapLink' | 'internalId' | 'categoryName'>
> & {
    categoryName?: string | null;
};

// The inbound-applicable projection of an AppSyncPatch: null values (Notion
// has no value) are dropped, because inbound sync keeps app fields rather
// than clearing them. Only the inbound decision produces this shape.
export type AppSyncApplyPatch = {
    [K in keyof AppSyncPatch]?: NonNullable<AppSyncPatch[K]>;
};

export const nullableString = v.union(v.string(), v.null());

export const notionFieldsValidator = {
    name: nullableString,
    categoryName: nullableString,
    address: nullableString,
    city: nullableString,
    country: nullableString,
    mapLink: nullableString,
    internalId: nullableString,
    installedPeriod: nullableString,
    isRemoved: v.boolean(),
    removalPeriod: nullableString,
    tagNames: v.array(v.string()),
    isVisited: v.boolean(),
    source: nullableString,
};

export const appApplyPatchValidator = {
    name: v.optional(v.string()),
    categoryName: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    installedPeriod: v.optional(v.string()),
    isRemoved: v.optional(v.boolean()),
    removalPeriod: v.optional(v.string()),
    tagNames: v.optional(v.array(v.string())),
    isVisited: v.optional(v.boolean()),
    source: v.optional(v.string()),
};
