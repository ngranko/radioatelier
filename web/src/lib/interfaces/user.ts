export interface ChangePasswordFormInputs {
    password: string;
    passwordConfirm: string;
}

export interface ChangePasswordFormErrors {
    password?: string;
    passwordConfirm?: string;
}

export interface MeResponseData {
    id: string;
    role: string;
    email: string;
}
