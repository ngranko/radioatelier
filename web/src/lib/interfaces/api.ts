import type KeyVal from '$lib/interfaces/keyVal';

export interface Payload<TData = unknown, TErrors = KeyVal<string>> {
    message: string;
    errors?: TErrors;
    data: TData;
}

export interface RawResponse<T> {
    status: number;
    payload: T;
}
