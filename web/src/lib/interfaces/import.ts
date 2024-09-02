import type {WebSocketMessage} from '$lib/api/websocket/WebSocketMessage';

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

export interface WSSendInputMessagePayload {
    id: string;
    mappings: ImportMappings;
}

export interface WSSuccessMessagePayload {
    text: string;
    errors: string[];
}

export interface WSErrorMessagePayload {
    error: string;
}

export interface WSProgressMessagePayload {
    percentage: number;
}

export type ImportSuccessHandler = (message: WebSocketMessage<WSSuccessMessagePayload>) => void;
export type ImportErrorHandler = (message: WebSocketMessage<WSErrorMessagePayload>) => void;
export type ImportDisconnectHandler = () => void;
export type ImportProgressHandler = (message: WebSocketMessage<WSProgressMessagePayload>) => void;

export interface ImportMappings {
    coordinates: number | null;
    name: number | null;
    isPublic: number | null;
    category: number | null;
    image: number | null;
    tags: number | null;
    privateTags: number | null;
    description: number | null;
    address: number | null;
    city: number | null;
    country: number | null;
    installedPeriod: number | null;
    isRemoved: number | null;
    removalPeriod: number | null;
    source: number | null;
}
