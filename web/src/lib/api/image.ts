import {METHOD_POST} from '$lib/api/constants.ts';
import AuthRequest from '$lib/api/request/AuthRequest.ts';
import JsonRequest from '$lib/api/request/JsonRequest.ts';
import type {Payload} from '$lib/interfaces/api.ts';
import type {
    CreatePreviewInputs,
    CreatePreviewPayloadData,
    UploadImageInputs,
    UploadImagePayloadData,
} from '$lib/interfaces/image.ts';

export async function uploadImage({
    formData,
}: UploadImageInputs): Promise<Payload<UploadImagePayloadData>> {
    return new AuthRequest(new JsonRequest(`/api/image`, METHOD_POST).setFormData(formData)).send();
}

export async function createPreview({
    id,
    position,
}: CreatePreviewInputs): Promise<Payload<CreatePreviewPayloadData>> {
    return new AuthRequest(
        new JsonRequest(`/api/image/${id}/preview`, METHOD_POST).setParams(position),
    ).send();
}
