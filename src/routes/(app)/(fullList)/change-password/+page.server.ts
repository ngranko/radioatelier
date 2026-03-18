import {getConvexClient} from '$lib/server/convexClient';
import {redirect} from '@sveltejs/kit';

export const load = async ({locals, url}) => {
    const {token} = await getConvexClient(locals);
    if (!token) {
        redirect(307, `/login?ref=${encodeURIComponent(url.pathname)}`);
    }
};
