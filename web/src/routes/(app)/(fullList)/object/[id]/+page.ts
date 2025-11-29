import {getObject} from '$lib/api/object.ts';
import type {Object, ObjectListItem} from '$lib/interfaces/object.ts';
import type {CurrentUser} from '$lib/interfaces/user.ts';
import {redirect} from '@sveltejs/kit';
import type {PageLoad} from './$types';

interface PageData {
    user: CurrentUser;
    objects: ObjectListItem[];
    activeObject?: Object;
}

export const load: PageLoad<PageData> = async ({fetch, params, parent}) => {
    let object = undefined;
    try {
        const result = await getObject(params.id, {fetch});
        object = result.data.object;
    } catch (error) {
        // TODO: navigate back instead of to root
        redirect(302, '/');
    }
    const {user, objects} = await parent();

    return {user, objects, activeObject: object};
};
