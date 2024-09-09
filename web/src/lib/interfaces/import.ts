import type {WebSocketMessage} from '$lib/api/websocket/WebSocketMessage';
import type {ImportProvider} from '$lib/services/importProvider';

export interface UploadFileInputs {
    formData: FormData;
}

export interface UploadFileResponseData {
    id: string;
}

export interface ExtractPreviewInputs {
    id: string;
    separator: string;
}

export interface ExtractPreviewResponseData {
    preview: string[][];
}

export interface WSSendInputMessagePayload {
    id: string;
    separator: string;
    mappings: ImportMappings;
}

export interface WSSuccessMessagePayload {
    text: string;
    feedback: LineFeedback[];
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

export interface ImportInfo {
    id: string;
    provider: ImportProvider;
    separator: string;
    currentStep: number;
    preview: string[][];
    status: string;
    percentage: number;
    resultText: string;
    lineFeedback: LineFeedback[];
    globalError: string;
}

export interface LineFeedback {
    text: string;
    severity: 'warning' | 'error';
}
