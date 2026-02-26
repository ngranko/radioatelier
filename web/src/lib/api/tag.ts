import {METHOD_GET} from '$lib/api/constants';
import AuthRequest from '$lib/api/request/AuthRequest';
import JsonRequest, {type JsonRequestOptions} from '$lib/api/request/JsonRequest';
import type {Payload} from '$lib/interfaces/api';
import type {ListTagsResponsePayload} from '$lib/interfaces/tag';

export async function listTags(
    options: JsonRequestOptions,
): Promise<Payload<ListTagsResponsePayload>> {
    return new AuthRequest(new JsonRequest('/api/tag/list', METHOD_GET, options)).send();
}
