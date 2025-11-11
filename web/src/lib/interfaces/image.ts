export interface UploadImageInputs {
    formData: FormData;
}

export interface UploadImagePayloadData {
    id: string;
    url: string;
    previewUrl: string;
}

export interface CreatePreviewInputs {
    id: string;
    position: Position;
}

export interface CreatePreviewPayloadData {
    id: string;
    previewUrl: string;
}

export interface Position {
    x: number;
    y: number;
    width: number;
    height: number;
}
