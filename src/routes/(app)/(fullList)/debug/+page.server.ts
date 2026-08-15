import {api} from '$convex/_generated/api';
import {getConvexClient} from '$lib/server/convexClient';
import {redirect} from '@sveltejs/kit';

export const load = async ({locals, url}) => {
    const {client, token} = await getConvexClient(locals);
    if (!token) {
        redirect(307, `/login?ref=${encodeURIComponent(url.pathname)}`);
    }

    const isAdmin = await client.query(api.users.isAdmin, {});
    if (!isAdmin) {
        redirect(302, '/');
    }
};
