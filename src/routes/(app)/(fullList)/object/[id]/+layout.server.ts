import {api} from '$convex/_generated/api';
import type {Id} from '$convex/_generated/dataModel';
import {getConvexClient} from '$lib/server/convexClient';
import {error, redirect} from '@sveltejs/kit';

export const load = async ({params, locals, isDataRequest, url}) => {
    const {client} = await getConvexClient(locals);
    const resolvedShareId = await client.query(api.objects.resolveShareId, {id: params.id});

    if (!resolvedShareId) {
        error(404, 'Object not found');
    }

    if (resolvedShareId.shouldRedirect) {
        redirect(307, `/object/${resolvedShareId.canonicalId}${url.search}`);
    }

    const object = client.query(api.objects.getDetails, {
        id: resolvedShareId.canonicalId as Id<'objects'>,
    });

    return {
        activeObject: isDataRequest
            ? undefined
            : await object.then(result => {
                  if (!result) {
                      error(404, 'Object not found');
                  }
                  return result;
              }),
        activeObjectPromise: isDataRequest ? object : undefined,
    };
};
