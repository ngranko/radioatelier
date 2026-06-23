import {api} from '$convex/_generated/api';
import {getConvexClient} from '$lib/server/convexClient';

export const load = async ({locals}) => {
    const {client, token} = await getConvexClient(locals);
    if (!token) {
        return {objects: [], visitedObjectIds: []};
    }

    const [objects, visitedObjectIds] = await Promise.all([
        client.query(api.markers.list),
        client.query(api.markers.listVisitedIds),
    ]);
    return {objects, visitedObjectIds};
};
