import {getObject} from '$lib/api/object.ts';
import {redirect} from '@sveltejs/kit';
import type {LayoutLoad} from './$types';

export const load: LayoutLoad = async ({fetch, params, parent, url}) => {
    let object = undefined;
    try {
        const result = await getObject(params.id, {fetch});
        object = result.data.object;
    } catch (error) {
        // TODO: navigate back instead of to root
        redirect(303, '/');
    }
    const {user, objects} = await parent();

    return {
        user,
        objects,
        activeObject: object,
        isEditPage: url.pathname.endsWith('/edit'),
    };
};
