import {api} from '$convex/_generated/api';
import {getConvexClient} from '$lib/server/convexClient';

export const load = async ({locals}) => {
    const {client, token} = await getConvexClient(locals);
    if (!token) {
        return {objects: []};
    }

    const objects = await client.query(api.markers.list, {});
    return {objects};
};
