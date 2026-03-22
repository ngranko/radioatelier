import {redirect} from '@sveltejs/kit';

export const load = ({locals, url}) => {
    if (!locals.auth().userId) {
        const ref = `${url.pathname}${url.search}`;
        redirect(307, `/login?ref=${encodeURIComponent(ref)}`);
    }
};
