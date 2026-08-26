import {api} from '$convex/_generated/api';
import {getConvexClient} from '$lib/server/convexClient';
import {redirect} from '@sveltejs/kit';

export const load = async ({locals, url}) => {
    const {client, token} = await getConvexClient(locals);
    if (!token && url.pathname.startsWith('/object/')) {
        return {categories: []};
    }
    if (!token && !url.pathname.startsWith('/object/')) {
        const ref = `${url.pathname}${url.search}`;
        redirect(307, `/login?ref=${encodeURIComponent(ref)}`);
    }

    const categories = await client.query(api.categories.list, {});
    return {categories};
};
