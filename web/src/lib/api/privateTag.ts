import type {Payload} from '$lib/interfaces/api';
import AuthRequest from '$lib/api/request/AuthRequest';
import JsonRequest from '$lib/api/request/JsonRequest';
import {METHOD_GET, METHOD_POST} from '$lib/api/constants';
import type {
    CreatePrivateTagInputs,
    CreatePrivateTagResponsePayload,
    ListPrivateTagsResponsePayload,
} from '$lib/interfaces/privateTag';

export async function createPrivateTag(
    values: CreatePrivateTagInputs,
): Promise<Payload<CreatePrivateTagResponsePayload>> {
    return new AuthRequest(
        new JsonRequest('/api/tag/private', METHOD_POST).setParams(values),
    ).send();
}

export async function listPrivateTags(): Promise<Payload<ListPrivateTagsResponsePayload>> {
    return new AuthRequest(new JsonRequest('/api/tag/private/list', METHOD_GET)).send();
}
