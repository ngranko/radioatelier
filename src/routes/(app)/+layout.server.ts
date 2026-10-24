import {api} from '$convex/_generated/api';
import {getConvexClient} from '$lib/server/convexClient';
import {allowsAnonymousViewer, buildLoginUrl} from '$lib/utils/loginRoute';
import {redirect} from '@sveltejs/kit';

export const load = async ({locals, url}) => {
    const {client, token} = await getConvexClient(locals);
    if (!token && allowsAnonymousViewer(url.pathname)) {
        return {categories: [], tags: [], privateTags: []};
    }
    if (!token) {
        redirect(307, buildLoginUrl(url));
    }

    const categories = await client.query(api.categories.list, {});
    const tags = await client.query(api.tags.list, {});
    const privateTags = await client.query(api.privateTags.list, {});
    return {categories, tags, privateTags};
};
