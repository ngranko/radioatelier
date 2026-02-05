import {defineSchema, defineTable} from 'convex/server';
import {v} from 'convex/values';

export default defineSchema({
    categories: defineTable({
        name: v.string(),
        mysqlId: v.optional(v.string()),
    }).index('byMysqlId', ['mysqlId']),
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
        internalId: v.string(),
        mysqlId: v.optional(v.string()),
    })
        .index('byIsPublic', ['isPublic'])
        .index('byMysqlId', ['mysqlId']),
    objectPrivateTags: defineTable({
        objectId: v.id('objects'),
        privateTagId: v.id('privateTags'),
    }).index('byObjectIdAndPrivateTagId', ['objectId', 'privateTagId']),
    objectTags: defineTable({
        objectId: v.id('objects'),
        tagId: v.id('tags'),
    }).index('byObjectIdAndTagId', ['objectId', 'tagId']),
    objectUsers: defineTable({
        objectId: v.id('objects'),
        userId: v.id('users'),
        isVisited: v.boolean(),
    }).index('byObjectIdAndUserId', ['objectId', 'userId']),
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
    }).index('byMysqlId', ['mysqlId']),
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
});
