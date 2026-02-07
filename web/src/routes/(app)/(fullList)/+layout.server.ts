import {PUBLIC_CONVEX_URL} from '$env/static/public';
import {ConvexHttpClient} from 'convex/browser';
import {api} from '$convex/_generated/api';
import {redirect} from '@sveltejs/kit';

export const load = async ({locals}) => {
    const auth = locals.auth();

    const client = new ConvexHttpClient(PUBLIC_CONVEX_URL);
    const token = await auth.getToken({template: 'convex'});
    if (!token) {
        // TODO: should I just return here if I want share pages to work without auth?
        throw redirect(303, '/login');
    }
    client.setAuth(token);

    const objects = await client.query(api.markers.getListForCurrentUser, {});
    return {objects};
};
