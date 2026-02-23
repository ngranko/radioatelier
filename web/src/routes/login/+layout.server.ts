import {redirect} from '@sveltejs/kit';

export const load = async ({locals}) => {
    const auth = locals.auth();
    if (auth.userId) {
        redirect(303, '/');
    }
};
