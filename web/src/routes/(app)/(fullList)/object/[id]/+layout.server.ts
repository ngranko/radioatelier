import {api} from '$convex/_generated/api';
import type {Id} from '$convex/_generated/dataModel';
import {getConvexClient} from '$lib/server/convexClient';

export const load = async ({params, locals, isDataRequest}) => {
    const {client} = await getConvexClient(locals);

    const object = client.query(api.objects.getDetails, {id: params.id as Id<'objects'>});

    // During SSR, await the data to ensure proper SEO and initial render
    // During client-side navigation, stream the data for faster perceived performance
    return {
        activeObject: isDataRequest ? undefined : await object,
        activeObjectPromise: isDataRequest ? object : undefined,
    };
};
