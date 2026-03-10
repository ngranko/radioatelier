import {redirect} from '@sveltejs/kit';

export const load = async ({parent, url}) => {
    const data = await parent();

    if (!data.initialState.userId) {
        redirect(307, `/login?ref=${encodeURIComponent(url.pathname)}`);
    }

    return data;
};
