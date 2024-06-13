import type {Payload} from '$lib/interfaces/api';
import JsonRequest from '$lib/api/request/JsonRequest';
import {METHOD_GET, METHOD_POST} from '$lib/api/constants';
import type {
    CreateObjectInputs,
    CreateObjectResponsePayload,
    GetObjectContext,
    GetObjectResponsePayload,
    ListObjectsResponsePayload,
} from '$lib/interfaces/object';
import AuthRequest from '$lib/api/request/AuthRequest';
import type {QueryFunctionContext} from '@tanstack/svelte-query';

export async function createObject(
    values: CreateObjectInputs,
): Promise<Payload<CreateObjectResponsePayload>> {
    return new AuthRequest(new JsonRequest('/api/object', METHOD_POST).setParams(values)).send();
}

export async function listObjects(): Promise<Payload<ListObjectsResponsePayload>> {
    return new AuthRequest(new JsonRequest('/api/object/list', METHOD_GET)).send();
}

export async function getObject({
    queryKey: [_key, {id}],
}: QueryFunctionContext<GetObjectContext>): Promise<Payload<GetObjectResponsePayload>> {
    return new AuthRequest(new JsonRequest(`/api/object/${id}`, METHOD_GET)).send();
}
