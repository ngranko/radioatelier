import type {UserJSON} from '@clerk/backend';
import {v, type Validator} from 'convex/values';
import {internalMutation, query, type QueryCtx} from './_generated/server';

export const current = query({
    args: {},
    handler: async ctx => {
        return await getCurrentUser(ctx);
    },
});

export const upsertFromClerk = internalMutation({
    args: {data: v.any() as Validator<UserJSON>},
    async handler(ctx, {data}) {
        const userAttributes = buildClerkUserAttributes(data);
        const user = await getUserByExternalId(ctx, data.id);

        if (user === null) {
            await ctx.db.insert('users', userAttributes);
            return;
        }

        await ctx.db.patch(user._id, userAttributes);
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
        role: typeof data.public_metadata.role === 'string' ? data.public_metadata.role : 'user',
        notionSyncEnabled: data.public_metadata.notionSyncEnabled === true,
        notionUserId:
            typeof data.public_metadata.notionUserId === 'string'
                ? data.public_metadata.notionUserId
                : undefined,
        isDeleted: false,
    };
}
