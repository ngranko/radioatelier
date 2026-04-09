import {api} from '$convex/_generated/api';
import {getConvexClient} from '$lib/server/convexClient';

export const load = async ({locals}) => {
    const {client, token} = await getConvexClient(locals);
    if (!token) {
        return {categories: []};
    }

    const categories = await client.query(api.categories.list, {});
    return {categories};
};
