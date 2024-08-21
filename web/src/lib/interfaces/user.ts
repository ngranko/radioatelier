export interface ChangePasswordFormInputs {
    password: string;
    passwordConfirm: string;
}

export interface ChangePasswordFormErrors {
    password?: string;
    passwordConfirm?: string;
}
