import {v} from 'convex/values';

const mapPointAddressFields = {
    address: v.nullable(v.string()),
    city: v.nullable(v.string()),
    country: v.nullable(v.string()),
};

const mapPointCoreFields = {
    latitude: v.number(),
    longitude: v.number(),
    ...mapPointAddressFields,
};

export const mapPointTableFields = {
    ...mapPointCoreFields,
    mysqlId: v.optional(v.string()),
};

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
    mysqlId: v.optional(v.string()),
};

export const objectTableFields = {
    ...objectCoreFields,
    mapPointId: v.id('mapPoints'),
    createdById: v.id('users'),
    internalId: v.string(),
};

export const createObjectRecordFields = {
    ...objectCoreFields,
    ...mapPointCoreFields,
    privateTags: v.array(v.id('privateTags')),
    isVisited: v.boolean(),
};

export const updateObjectRecordFields = {
    ...objectCoreFields,
    ...mapPointAddressFields,
    privateTags: v.array(v.id('privateTags')),
    isVisited: v.boolean(),
};

export const repositionObjectRecordFields = {
    latitude: v.number(),
    longitude: v.number(),
};
