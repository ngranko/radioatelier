import {api} from '$convex/_generated/api';
import {getConvexClient} from '$lib/server/convexClient';
import {redirect} from '@sveltejs/kit';

export const load = async ({locals, url}) => {
    const {client, token} = await getConvexClient(locals);
    if (!token && url.pathname.startsWith('/object/')) {
        return {categories: [], tags: [], privateTags: []};
    }
    if (!token && !url.pathname.startsWith('/object/')) {
        const ref = `${url.pathname}${url.search}`;
        redirect(307, `/login?ref=${encodeURIComponent(ref)}`);
    }

    const [categories, tags, privateTags] = await Promise.all([
        client.query(api.categories.list, {}),
        client.query(api.tags.list, {}),
        client.query(api.privateTags.list, {}),
    ]);
    return {categories, tags, privateTags};
};
