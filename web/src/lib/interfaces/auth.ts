import type {Payload} from '$lib/interfaces/api';

export interface LoginFormInputs {
    email: string;
    password: string;
}

export interface LoginResponsePayload extends Payload {
    errors?: {
        email?: string;
        password?: string;
    };
    data: {
        refreshToken: string;
    };
}
