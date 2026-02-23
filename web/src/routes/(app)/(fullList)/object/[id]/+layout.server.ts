import {api} from '$convex/_generated/api';
import type {Id} from '$convex/_generated/dataModel';
import {getConvexClient} from '$lib/server/convexClient';
import {error} from '@sveltejs/kit';

export const load = async ({params, locals, isDataRequest}) => {
    const {client} = await getConvexClient(locals);

    const object = client.query(api.objects.getDetails, {id: params.id as Id<'objects'>});

    return {
        activeObject: isDataRequest ? undefined : await object.then((result) => {
            if (!result) {
                error(404, 'Object not found');
            }
            return result;
        }),
        activeObjectPromise: isDataRequest ? object : undefined,
    };
};
