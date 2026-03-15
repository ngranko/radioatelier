import {defineSchema, defineTable} from 'convex/server';
import {v} from 'convex/values';
import {mapPointTableFields, objectTableFields} from './sharedValidators';

export default defineSchema({
    categories: defineTable({
        name: v.string(),
    }).index('byName', ['name']),
    counters: defineTable({
        name: v.string(),
        value: v.number(),
    }).index('byName', ['name']),
    images: defineTable({
        originalStorageId: v.id('_storage'),
        previewStorageId: v.optional(v.id('_storage')),
    }),
    importJobs: defineTable({
        createdById: v.id('users'),
        status: v.union(
            v.literal('running'),
            v.literal('success'),
            v.literal('error'),
            v.literal('cancelled'),
        ),
        totalRows: v.number(),
        processedRows: v.number(),
        successfulRows: v.number(),
        percentage: v.number(),
        startedAt: v.number(),
        finishedAt: v.optional(v.number()),
        globalError: v.optional(v.string()),
        lastBatchSequence: v.optional(v.number()),
        feedback: v.array(
            v.object({
                line: v.number(),
                text: v.string(),
                severity: v.union(v.literal('warning'), v.literal('error')),
            }),
        ),
    }),
    mapPoints: defineTable(mapPointTableFields)
        .index('byLatitudeAndLongitude', ['latitude', 'longitude'])
        .index('byAddressCityCountry', ['address', 'city', 'country']),
    markers: defineTable({
        objectId: v.id('objects'),
        latitude: v.number(),
        longitude: v.number(),
        createdById: v.id('users'),
        categoryId: v.id('categories'),
        tagIds: v.array(v.id('tags')),
        isRemoved: v.boolean(),
        isPublic: v.boolean(),
    })
        .index('byCreatedByIdAndIsPublic', ['createdById', 'isPublic'])
        .index('byIsPublic', ['isPublic'])
        .index('byObjectId', ['objectId']),
    objects: defineTable(objectTableFields)
        .index('byIsPublic', ['isPublic'])
        .index('byMysqlId', ['mysqlId'])
        .index('byCreatedById', ['createdById']),
    objectPrivateTags: defineTable({
        objectId: v.id('objects'),
        privateTagIds: v.array(v.id('privateTags')),
        userId: v.id('users'),
    }).index('byObjectIdUserId', ['objectId', 'userId']),
    privateTags: defineTable({
        name: v.string(),
        createdById: v.id('users'),
    })
        .index('byCreatedById', ['createdById'])
        .index('byNameCreatedById', ['name', 'createdById']),
    tags: defineTable({
        name: v.string(),
    }).index('byName', ['name']),
    users: defineTable({
        email: v.string(),
        // this is the Clerk ID, stored in the subject JWT field
        externalId: v.string(),
        role: v.string(),
        lastActiveAt: v.nullable(v.number()),
        lastLoginAt: v.nullable(v.number()),
        isDeleted: v.boolean(),
    }).index('byExternalIdIsDeleted', ['externalId', 'isDeleted']),
    userVisitedChunks: defineTable({
        userId: v.id('users'),
        chunkId: v.string(),
        visitedObjectIds: v.array(v.id('objects')),
    }).index('byUserIdAndChunkId', ['userId', 'chunkId']),
});
