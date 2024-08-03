import type {Payload} from '$lib/interfaces/api';
import AuthRequest from '$lib/api/request/AuthRequest';
import JsonRequest from '$lib/api/request/JsonRequest';
import {METHOD_GET, METHOD_POST} from '$lib/api/constants';
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

export async function listTags(): Promise<Payload<ListTagsResponsePayload>> {
    return new AuthRequest(new JsonRequest('/api/tag/list', METHOD_GET)).send();
}
