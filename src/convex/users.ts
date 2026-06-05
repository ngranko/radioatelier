import type {UserJSON} from '@clerk/backend';
import {v, type Validator} from 'convex/values';
import type {Doc} from './_generated/dataModel';
import {internalMutation, mutation, query, type QueryCtx} from './_generated/server';
import {clerkTimestamp} from './helpers/clerkTimestamps';

export const current = query({
    args: {},
    handler: async ctx => {
        return await getCurrentUser(ctx);
    },
});

export const recordActivity = mutation({
    args: {isLogin: v.optional(v.boolean())},
    handler: async (ctx, {isLogin}) => {
        const user = await getCurrentUser(ctx);
        if (!user) {
            return;
        }

        const now = Date.now();
        await ctx.db.patch(user._id, {
            lastActiveAt: now,
            ...(isLogin ? {lastLoginAt: now} : {}),
        });
    },
});

export const upsertFromClerk = internalMutation({
    args: {data: v.any() as Validator<UserJSON>},
    async handler(ctx, {data}) {
        const userAttributes = buildClerkUserAttributes(data);
        const timestampFields = buildClerkTimestampFields(data);
        const user = await getUserByExternalId(ctx, data.id);

        if (user === null) {
            await ctx.db.insert('users', {
                ...userAttributes,
                lastActiveAt: timestampFields.lastActiveAt,
                lastLoginAt: timestampFields.lastLoginAt,
            });
            return;
        }

        const patch: Partial<Doc<'users'>> = {...userAttributes};
        if (timestampFields.lastActiveAt !== null) {
            patch.lastActiveAt = timestampFields.lastActiveAt;
        }
        if (timestampFields.lastLoginAt !== null) {
            patch.lastLoginAt = timestampFields.lastLoginAt;
        }
        await ctx.db.patch(user._id, patch);
    },
});

export const recordSessionFromClerk = internalMutation({
    args: {
        clerkUserId: v.string(),
        lastActiveAt: v.number(),
        lastLoginAt: v.number(),
    },
    handler: async (ctx, {clerkUserId, lastActiveAt, lastLoginAt}) => {
        const user = await getUserByExternalId(ctx, clerkUserId);
        if (user === null) {
            console.warn(`Can't record session, there is no user for Clerk user ID: ${clerkUserId}`);
            return;
        }

        await ctx.db.patch(user._id, {lastActiveAt, lastLoginAt});
    },
});

export const deleteFromClerk = internalMutation({
    args: {clerkUserId: v.string()},
    async handler(ctx, {clerkUserId}) {
        const user = await getUserByExternalId(ctx, clerkUserId);

        if (user !== null) {
            await ctx.db.patch(user._id, {isDeleted: true});
        } else {
            console.warn(`Can't delete user, there is none for Clerk user ID: ${clerkUserId}`);
        }
    },
});

export async function getCurrentUserOrThrow(ctx: QueryCtx) {
    const userRecord = await getCurrentUser(ctx);
    if (!userRecord || userRecord.isDeleted) {
        throw new Error("Can't get current user");
    }
    return userRecord;
}

export async function getCurrentUser(ctx: QueryCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
        return null;
    }
    return await getUserByExternalId(ctx, identity.subject);
}

export async function getUserByExternalId(ctx: QueryCtx, externalId: string) {
    return await ctx.db
        .query('users')
        .withIndex('byExternalIdIsDeleted', q =>
            q.eq('externalId', externalId).eq('isDeleted', false),
        )
        .unique();
}

export async function getUserByNotionUserId(ctx: QueryCtx, notionUserId: string) {
    return await ctx.db
        .query('users')
        .withIndex('byNotionUserId', q => q.eq('notionUserId', notionUserId))
        .filter(q => q.eq(q.field('isDeleted'), false))
        .unique();
}

function buildClerkUserAttributes(data: UserJSON) {
    return {
        email: data.email_addresses[0]?.email_address ?? '',
        externalId: data.id,
        role:
            typeof data.public_metadata.role === 'string' ? data.public_metadata.role : 'user',
        notionSyncEnabled: data.public_metadata.notionSyncEnabled === true,
        notionUserId:
            typeof data.public_metadata.notionUserId === 'string'
                ? data.public_metadata.notionUserId
                : undefined,
        isDeleted: false,
    };
}

function buildClerkTimestampFields(data: Pick<UserJSON, 'last_active_at' | 'last_sign_in_at'>) {
    return {
        lastActiveAt: clerkTimestamp(data.last_active_at),
        lastLoginAt: clerkTimestamp(data.last_sign_in_at),
    };
}
