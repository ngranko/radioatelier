import {api} from '$convex/_generated/api';
import {getConvexClient} from '$lib/server/convexClient';
import {redirect} from '@sveltejs/kit';

export const load = async ({locals}) => {
    const {client, token} = await getConvexClient(locals);
    if (!token) {
        // TODO: should I just return here if I want share pages to work without auth?
        throw redirect(303, '/login');
    }

    const objects = await client.query(api.markers.list, {});
    return {objects};
};
