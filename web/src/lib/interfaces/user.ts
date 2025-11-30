import type {Payload} from '$lib/interfaces/api.ts';

export interface ChangePasswordFormInputs extends Record<string, string> {
    password: string;
    passwordConfirm: string;
}

export interface ChangePasswordResponsePayload extends Payload {
    errors?: {
        password?: string;
        passwordConfirm?: string;
    };
}

export interface MeResponseData {
    id: string;
    role: string;
    email: string;
}

export interface CurrentUser {
    auth: boolean;
    profile?: MeResponseData;
}
