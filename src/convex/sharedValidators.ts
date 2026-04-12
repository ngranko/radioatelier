import {v} from 'convex/values';

export function assertValidMapPointCoordinates(latitude: number, longitude: number): void {
    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
    ) {
        throw new Error('Invalid map coordinates');
    }
}

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
};

export const objectTableFields = {
    ...objectCoreFields,
    mysqlId: v.optional(v.string()),
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

export const typesenseObjectSchema = v.object({
    id: v.id('objects'),
    name: v.string(),
    address: v.nullable(v.string()),
    city: v.nullable(v.string()),
    country: v.nullable(v.string()),
    categoryName: v.string(),
    location: v.array(v.number()),
    createdBy: v.id('users'),
    isPublic: v.boolean(),
});
