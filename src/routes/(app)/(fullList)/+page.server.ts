import {buildLoginUrl} from '$lib/utils/loginRoute';
import {redirect} from '@sveltejs/kit';

export const load = ({locals, url}) => {
    if (!locals.auth().userId) {
        redirect(307, buildLoginUrl(url));
    }
};
