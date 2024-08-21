import type {ChangePasswordFormInputs} from '$lib/interfaces/user';
import type {Payload} from '$lib/interfaces/api';
import AuthRequest from '$lib/api/request/AuthRequest';
import JsonRequest from '$lib/api/request/JsonRequest';
import {METHOD_POST} from '$lib/api/constants';

export async function changePassword(values: ChangePasswordFormInputs): Promise<Payload> {
    return new AuthRequest(
        new JsonRequest('/api/user/password', METHOD_POST).setParams(values),
    ).send();
}
