export interface ChangePasswordFormInputs extends Record<string, string> {
    password: string;
    passwordConfirm: string;
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
