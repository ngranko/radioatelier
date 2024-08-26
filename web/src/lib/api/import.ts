import JsonRequest from '$lib/api/request/JsonRequest';
import {METHOD_GET, METHOD_POST} from '$lib/api/constants';
import AuthRequest from '$lib/api/request/AuthRequest';
import type {Payload} from '$lib/interfaces/api';
import type {
    GetPreviewInputs,
    GetPreviewResponseData,
    UploadFileInputs,
    UploadFileResponseData,
} from '$lib/interfaces/import';

export function uploadFile({formData}: UploadFileInputs): Promise<Payload<UploadFileResponseData>> {
    return new AuthRequest(
        new JsonRequest(`/api/import/upload`, METHOD_POST).setFormData(formData),
    ).send();
}

export function getPreview({
    id,
    separator,
}: GetPreviewInputs): Promise<Payload<GetPreviewResponseData>> {
    return new AuthRequest(
        new JsonRequest(`/api/import/preview/${id}`, METHOD_GET).setParam(
            'separator',
            encodeURIComponent(separator),
        ),
    ).send();
}
