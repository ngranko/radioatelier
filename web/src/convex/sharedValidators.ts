import {v} from 'convex/values';

const mapPointCoreFields = {
    latitude: v.number(),
    longitude: v.number(),
    address: v.string(),
    city: v.string(),
    country: v.string(),
};

export const mapPointTableFields = {
    ...mapPointCoreFields,
    mysqlId: v.optional(v.string()),
};

export const createObjectLocationFields = mapPointCoreFields;

const objectCoreFields = {
    name: v.string(),
    description: v.nullable(v.string()),
    installedPeriod: v.nullable(v.string()),
    isRemoved: v.boolean(),
    removalPeriod: v.nullable(v.string()),
    source: v.nullable(v.string()),
    coverId: v.nullable(v.id('images')),
    categoryId: v.id('categories'),
    isPublic: v.boolean(),
    tagIds: v.array(v.id('tags')),
    internalId: v.string(),
    mysqlId: v.optional(v.string()),
};

export const objectTableFields = {
    ...objectCoreFields,
    mapPointId: v.id('mapPoints'),
    createdById: v.id('users'),
};

export const createObjectRecordFields = {
    ...objectCoreFields,
    description: v.string(),
    installedPeriod: v.string(),
    removalPeriod: v.string(),
    source: v.string(),
    coverId: v.id('images'),
};
