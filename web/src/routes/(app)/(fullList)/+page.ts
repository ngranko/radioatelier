import {redirect} from '@sveltejs/kit';

export const load = async ({parent, url}) => {
    const data = await parent();

    if (!data.initialState.userId) {
        redirect(303, `/login?ref=${encodeURIComponent(url.pathname)}`);
    }

    return data;
};
