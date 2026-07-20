import {v} from 'convex/values';
import type {Doc} from '../_generated/dataModel';
import {internalQuery} from '../_generated/server';
import {getNotionSyncFallbackUserExternalId} from '../notion/config';
import type {NotionPage} from '../notion/types';
import {getUserByExternalId, getUserByNotionUserId} from '../users';

type ObjectOwnerCandidate = Pick<Doc<'users'>, 'isDeleted' | 'notionSyncEnabled'>;

export function getNotionPageOwnerId(page: Pick<NotionPage, 'created_by' | 'last_edited_by'>) {
    return page.created_by?.id ?? page.last_edited_by?.id ?? null;
}

export function chooseObjectOwner<T extends ObjectOwnerCandidate>(
    mappedUser: T | null,
    fallbackUser: T | null,
): T | null {
    if (isEligibleOwner(mappedUser)) {
        return mappedUser;
    }
    if (isEligibleOwner(fallbackUser)) {
        return fallbackUser;
    }
    return null;
}

export const resolveObjectOwner = internalQuery({
    args: {
        notionUserId: v.union(v.string(), v.null()),
    },
    handler: async (ctx, {notionUserId}): Promise<Doc<'users'> | null> => {
        const mappedUser = notionUserId ? await getUserByNotionUserId(ctx, notionUserId) : null;
        const fallbackUser = await getUserByExternalId(ctx, getNotionSyncFallbackUserExternalId());
        return chooseObjectOwner(mappedUser, fallbackUser);
    },
});

function isEligibleOwner<T extends ObjectOwnerCandidate>(user: T | null): user is T {
    return user !== null && user.notionSyncEnabled === true && !user.isDeleted;
}
