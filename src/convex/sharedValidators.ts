import {type Infer, v} from 'convex/values';
import {LIMITS} from '../lib/utils/fieldLimits';

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

const objectTextFieldLimits = {
    name: LIMITS.name,
    description: LIMITS.description,
    installedPeriod: LIMITS.period,
    removalPeriod: LIMITS.period,
    source: LIMITS.source,
    address: LIMITS.address,
    city: LIMITS.city,
    country: LIMITS.country,
};

type ObjectTextFields = Partial<Record<keyof typeof objectTextFieldLimits, string | null>>;

// Convex validators cannot express length, and the browser calls mutations
// directly, so the form's zod caps do not protect the database.
export function assertObjectFieldLengths(data: ObjectTextFields): void {
    for (const [field, maxLength] of Object.entries(objectTextFieldLimits)) {
        const value = data[field as keyof ObjectTextFields];
        if (value && value.length > maxLength) {
            throw new Error(`Field ${field} exceeds ${maxLength} characters`);
        }
    }
}

const mapPointAddressFields = {
    address: v.nullable(v.string()),
    city: v.nullable(v.string()),
    country: v.nullable(v.string()),
};

export const mapPointCoreFields = {
    latitude: v.number(),
    longitude: v.number(),
    ...mapPointAddressFields,
};

export type MapPointCoreData = Infer<ReturnType<typeof v.object<typeof mapPointCoreFields>>>;

export const mapPointTableFields = {
    ...mapPointCoreFields,
};

export const objectCoreFields = {
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

export type ObjectCoreData = Infer<ReturnType<typeof v.object<typeof objectCoreFields>>>;

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
