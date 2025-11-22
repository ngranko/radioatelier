import {redirect} from '@sveltejs/kit';
import type {PageLoad} from './$types';

export const load: PageLoad = async ({parent, url}) => {
    const data = await parent();
    if (!data.user.auth) {
        redirect(302, `/login?ref=${encodeURIComponent(url.pathname)}`);
    }

    return data;
};
