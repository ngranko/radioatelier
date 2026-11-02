import type {Id} from '../_generated/dataModel';
import type {QueryCtx} from '../_generated/server';
import {capitalizeCategoryName} from './importHelpers';
import {taxonomyError} from './taxonomyGuards';

// Categories keep the capitalized form imports and Notion write; tags have
// always been stored lowercase.
export function normalizeCategoryName(name: string) {
    return requireName(capitalizeCategoryName(name));
}

export function normalizeTagName(name: string) {
    return requireName(name.trim().toLowerCase());
}

export function findTagByName(ctx: Pick<QueryCtx, 'db'>, name: string) {
    return ctx.db
        .query('tags')
        .withIndex('byName', q => q.eq('name', name))
        .first();
}

// Private tags are per-user, so the same name may exist once per owner.
export function findPrivateTagByName(
    ctx: Pick<QueryCtx, 'db'>,
    ownerId: Id<'users'>,
    name: string,
) {
    return ctx.db
        .query('privateTags')
        .withIndex('byNameCreatedById', q => q.eq('name', name).eq('createdById', ownerId))
        .first();
}

function requireName(name: string) {
    if (!name) {
        throw taxonomyError('nameRequired');
    }
    return name;
}
