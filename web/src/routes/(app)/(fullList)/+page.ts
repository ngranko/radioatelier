import {redirect} from '@sveltejs/kit';
import type {PageLoad} from './$types';

export const load: PageLoad = async ({parent}) => {
    const data = await parent();
    if (!data.user.auth) {
        redirect(302, '/login');
    }

    return data;
};
