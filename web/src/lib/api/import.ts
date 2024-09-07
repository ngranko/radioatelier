import JsonRequest from '$lib/api/request/JsonRequest';
import {METHOD_POST} from '$lib/api/constants';
import AuthRequest from '$lib/api/request/AuthRequest';
import type {Payload} from '$lib/interfaces/api';
import type {
    ExtractPreviewInputs,
    ExtractPreviewResponseData,
    UploadFileInputs,
    UploadFileResponseData,
} from '$lib/interfaces/import';

export function uploadFile({formData}: UploadFileInputs): Promise<Payload<UploadFileResponseData>> {
    return new AuthRequest(
        new JsonRequest(`/api/import/upload`, METHOD_POST).setFormData(formData),
    ).send();
}

export function extractPreview(
    params: ExtractPreviewInputs,
): Promise<Payload<ExtractPreviewResponseData>> {
    return new AuthRequest(
        new JsonRequest(`/api/import/preview`, METHOD_POST).setParams(params),
    ).send();
}
