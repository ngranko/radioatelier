import type {METHOD_DELETE, METHOD_GET, METHOD_POST, METHOD_PUT} from '$lib/api/constants';

export type HttpMethod =
    | typeof METHOD_GET
    | typeof METHOD_POST
    | typeof METHOD_PUT
    | typeof METHOD_DELETE;
