import type {Payload} from '$lib/interfaces/api';
import JsonRequest from '$lib/api/request/JsonRequest';
import {METHOD_DELETE, METHOD_GET, METHOD_POST, METHOD_PUT} from '$lib/api/constants';
import type {
    CreateObjectInputs,
    CreateObjectResponsePayload,
    DeleteObjectInputs,
    DeleteObjectPayloadData,
    GetObjectContext,
    GetObjectResponsePayload,
    ListObjectsResponsePayload,
    RepositionObjectInputs,
    RepositionObjectResponsePayload,
    UpdateObjectInputs,
    UpdateObjectResponsePayload,
    UploadImageInputs,
    UploadImagePayloadData,
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

export async function updateObject(
    values: UpdateObjectInputs,
): Promise<Payload<UpdateObjectResponsePayload>> {
    return new AuthRequest(
        new JsonRequest(`/api/object/${values.id}`, METHOD_PUT).setParams(values.updatedFields),
    ).send();
}

export async function repositionObject(
    values: RepositionObjectInputs,
): Promise<Payload<RepositionObjectResponsePayload>> {
    return new AuthRequest(
        new JsonRequest(`/api/object/${values.id}/position`, METHOD_PUT).setParams(
            values.updatedFields,
        ),
    ).send();
}

export async function uploadImage({
    id,
    formData,
}: UploadImageInputs): Promise<Payload<UploadImagePayloadData>> {
    return new AuthRequest(
        new JsonRequest(`/api/object/${id}/image`, METHOD_POST).setFormData(formData),
    ).send();
}

export async function deleteObject(
    values: DeleteObjectInputs,
): Promise<Payload<DeleteObjectPayloadData>> {
    return new AuthRequest(new JsonRequest(`/api/object/${values.id}`, METHOD_DELETE)).send();
}
