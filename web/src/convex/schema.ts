import {defineSchema, defineTable} from 'convex/server';
import {v} from 'convex/values';

export default defineSchema({
    users: defineTable({
        email: v.string(),
        // this is the Clerk ID, stored in the subject JWT field
        externalId: v.string(),
        role: v.string(),
        lastActiveAt: v.nullable(v.number()),
        lastLoginAt: v.nullable(v.number()),
    }).index('byExternalId', ['externalId']),
});
