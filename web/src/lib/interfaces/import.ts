export interface UploadFileInputs {
    formData: FormData;
}

export interface UploadFileResponseData {
    id: string;
}

export interface GetPreviewInputs {
    id: string;
    separator: string;
}

export interface GetPreviewResponseData {
    preview: string[][];
}
