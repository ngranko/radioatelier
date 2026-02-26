import {METHOD_GET} from '$lib/api/constants';
import AuthRequest from '$lib/api/request/AuthRequest';
import JsonRequest, {type JsonRequestOptions} from '$lib/api/request/JsonRequest';
import type {Payload} from '$lib/interfaces/api';
import type {ListPrivateTagsResponsePayload} from '$lib/interfaces/privateTag';

export async function listPrivateTags(
    options: JsonRequestOptions,
): Promise<Payload<ListPrivateTagsResponsePayload>> {
    return new AuthRequest(new JsonRequest('/api/tag/private/list', METHOD_GET, options)).send();
}
