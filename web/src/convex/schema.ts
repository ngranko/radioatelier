import {defineSchema, defineTable} from 'convex/server';
import {v} from 'convex/values';

export default defineSchema({
    categories: defineTable({
        name: v.string(),
        mysqlId: v.optional(v.string()),
    })
        .index('byMysqlId', ['mysqlId'])
        .index('byName', ['name']),
    counters: defineTable({
        name: v.string(),
        value: v.number(),
    }),
    images: defineTable({
        url: v.string(),
        previewUrl: v.nullable(v.string()),
        mysqlId: v.optional(v.string()),
    }).index('byMysqlId', ['mysqlId']),
    mapPoints: defineTable({
        latitude: v.number(),
        longitude: v.number(),
        address: v.string(),
        city: v.string(),
        country: v.string(),
        mysqlId: v.optional(v.string()),
    })
        .index('byLatitudeAndLongitude', ['latitude', 'longitude'])
        .index('byAddressCityCountry', ['address', 'city', 'country'])
        .index('byMysqlId', ['mysqlId']),
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
    objects: defineTable({
        name: v.string(),
        description: v.nullable(v.string()),
        installedPeriod: v.nullable(v.string()),
        isRemoved: v.boolean(),
        removalPeriod: v.nullable(v.string()),
        source: v.nullable(v.string()),
        coverId: v.nullable(v.id('images')),
        categoryId: v.id('categories'),
        mapPointId: v.id('mapPoints'),
        isPublic: v.boolean(),
        createdById: v.id('users'),
        tagIds: v.array(v.id('tags')),
        internalId: v.string(),
        mysqlId: v.optional(v.string()),
    })
        .index('byIsPublic', ['isPublic'])
        .index('byMysqlId', ['mysqlId'])
        .index('byCreatorId', ['createdById']),
    objectPrivateTags: defineTable({
        objectId: v.id('objects'),
        privateTagId: v.id('privateTags'),
    }).index('byObjectIdAndPrivateTagId', ['objectId', 'privateTagId']),
    privateTags: defineTable({
        name: v.string(),
        createdById: v.id('users'),
        mysqlId: v.optional(v.string()),
    })
        .index('byCreatedById', ['createdById'])
        .index('byNameCreatedById', ['name', 'createdById'])
        .index('byMysqlId', ['mysqlId']),
    tags: defineTable({
        name: v.string(),
        mysqlId: v.optional(v.string()),
    })
        .index('byMysqlId', ['mysqlId'])
        .index('byName', ['name']),
    users: defineTable({
        email: v.string(),
        // this is the Clerk ID, stored in the subject JWT field
        externalId: v.string(),
        role: v.string(),
        lastActiveAt: v.nullable(v.number()),
        lastLoginAt: v.nullable(v.number()),
        mysqlId: v.optional(v.string()),
    })
        .index('byExternalId', ['externalId'])
        .index('byMysqlId', ['mysqlId']),
    userVisitedChunks: defineTable({
        userId: v.id('users'),
        chunkId: v.string(),
        visitedObjectIds: v.array(v.id('objects')),
    }).index('byUserIdAndChunkId', ['userId', 'chunkId']),
});
