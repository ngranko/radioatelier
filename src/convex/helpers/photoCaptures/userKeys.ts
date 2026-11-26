import type {Id} from '../../_generated/dataModel';
import type {QueryCtx} from '../../_generated/server';

export async function findUserOpenRouterKey(ctx: QueryCtx, userId: Id<'users'>) {
    return await ctx.db
        .query('userOpenRouterKeys')
        .withIndex('byUserId', q => q.eq('userId', userId))
        .unique();
}
