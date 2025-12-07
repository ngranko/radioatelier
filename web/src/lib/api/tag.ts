import {METHOD_GET, METHOD_POST} from '$lib/api/constants';
import AuthRequest from '$lib/api/request/AuthRequest';
import JsonRequest, {type JsonRequestOptions} from '$lib/api/request/JsonRequest';
import type {Payload} from '$lib/interfaces/api';
import type {
    CreateTagInputs,
    CreateTagResponsePayload,
    ListTagsResponsePayload,
} from '$lib/interfaces/tag';

export async function createTag(
    values: CreateTagInputs,
): Promise<Payload<CreateTagResponsePayload>> {
    return new AuthRequest(new JsonRequest('/api/tag', METHOD_POST).setParams(values)).send();
}

export async function listTags(
    options: JsonRequestOptions,
): Promise<Payload<ListTagsResponsePayload>> {
    return new AuthRequest(new JsonRequest('/api/tag/list', METHOD_GET, options)).send();
}
