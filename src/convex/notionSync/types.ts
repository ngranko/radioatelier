import {v} from 'convex/values';

export type AppSyncFields = {
    name: string;
    categoryName: string;
    address: string | null;
    city: string | null;
    country: string | null;
    mapLink: string;
    installedPeriod: string | null;
    isRemoved: boolean;
    removalPeriod: string | null;
    tagNames: string[];
    isVisited: boolean;
    source: string | null;
};

export type AppSyncPatch = Partial<Omit<AppSyncFields, 'mapLink' | 'categoryName'>> & {
    categoryName?: string | null;
};

export const nullableString = v.union(v.string(), v.null());

export const notionFieldsValidator = {
    name: nullableString,
    categoryName: nullableString,
    address: nullableString,
    city: nullableString,
    country: nullableString,
    mapLink: nullableString,
    installedPeriod: nullableString,
    isRemoved: v.boolean(),
    removalPeriod: nullableString,
    tagNames: v.array(v.string()),
    isVisited: v.boolean(),
    source: nullableString,
};

export const appPatchValidator = {
    name: v.optional(v.string()),
    categoryName: v.optional(nullableString),
    address: v.optional(nullableString),
    city: v.optional(nullableString),
    country: v.optional(nullableString),
    installedPeriod: v.optional(nullableString),
    isRemoved: v.optional(v.boolean()),
    removalPeriod: v.optional(nullableString),
    tagNames: v.optional(v.array(v.string())),
    isVisited: v.optional(v.boolean()),
    source: v.optional(nullableString),
};
