import {api} from '$convex/_generated/api';
import {getConvexClient} from '$lib/server/convexClient';

export const load = async ({locals}) => {
    const {client, token} = await getConvexClient(locals);
    if (!token) {
        return {categories: [], tags: [], privateTags: []};
    }

    const categories = await client.query(api.categories.list, {});
    const tags = await client.query(api.tags.list, {});
    const privateTags = await client.query(api.privateTags.list, {});
    return {categories, tags, privateTags};
};
