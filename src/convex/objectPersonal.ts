import {v} from 'convex/values';
import {mutation} from './_generated/server';
import {updateObjectPersonalState} from './helpers/objectPersonalState';
import {objectPersonalFields} from './sharedValidators';
import {getCurrentUserOrThrow} from './users';

export const update = mutation({
    args: {id: v.id('objects'), data: v.object(objectPersonalFields)},
    returns: v.id('objects'),
    handler: async (ctx, {id, data}) => {
        const user = await getCurrentUserOrThrow(ctx);
        return updateObjectPersonalState(ctx, id, user, data);
    },
});
