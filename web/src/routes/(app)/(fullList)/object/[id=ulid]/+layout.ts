import {browser} from '$app/environment';
import {getObject} from '$lib/api/object.ts';
import {redirect} from '@sveltejs/kit';
import type {LayoutLoad} from './$types';
import type {Object} from '$lib/interfaces/object.ts';

export const load: LayoutLoad = async ({fetch, params, parent, url}) => {
    const {user, objects} = await parent();
    const isEditPage = url.pathname.endsWith('/edit');

    const fetchObject = async (): Promise<Object> => {
        try {
            const result = await getObject(params.id, {fetch});
            return result.data.object;
        } catch (error) {
            // TODO: navigate back instead of to root
            redirect(303, '/');
        }
    };

    // During SSR, await the data to ensure proper SEO and initial render
    // During client-side navigation, stream the data for faster perceived performance
    if (browser) {
        return {
            user,
            objects,
            activeObject: undefined,
            activeObjectPromise: fetchObject(),
            isEditPage,
        };
    }

    const object = await fetchObject();
    return {
        user,
        objects,
        activeObject: object,
        activeObjectPromise: undefined,
        isEditPage,
    };
};
