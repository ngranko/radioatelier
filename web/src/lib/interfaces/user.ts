export interface ChangePasswordFormInputs extends Record<string, string> {
    password: string;
    passwordConfirm: string;
}

export type ChangePasswordFormErrors = Partial<
    Record<keyof ChangePasswordFormInputs, string | string[]>
>;

export interface MeResponseData {
    id: string;
    role: string;
    email: string;
}
