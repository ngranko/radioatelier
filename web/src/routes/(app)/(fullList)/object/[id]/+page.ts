import {getObjectDirect} from '$lib/api/object.ts';
import type {Object, ObjectListItem} from '$lib/interfaces/object.ts';
import type {CurrentUser} from '$lib/interfaces/user.ts';
import type {PageLoad} from './$types';

interface PageData {
    user: CurrentUser;
    objects: ObjectListItem[];
    activeObject?: Object;
}

export const load: PageLoad<PageData> = async ({fetch, params, parent}) => {
    let object = undefined;
    try {
        const result = await getObjectDirect(params.id, {fetch});
        object = result.data.object;
    } catch (error) {
        // do nothing
    }
    const {user, objects} = await parent();

    return {user, objects, activeObject: object};
};
