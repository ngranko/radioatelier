import type KeyVal from '$lib/interfaces/keyVal';

export interface Payload<TData = unknown, TErrors = KeyVal<string>> {
    message: string;
    errors?: TErrors;
    data: TData;
}

export interface RawResponse<T = unknown> {
    status: number;
    payload: Payload<T>;
}
