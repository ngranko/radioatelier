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

export interface WSMessagePayload {
    type: string;
    total: number;
    successful: number;
    percentage: number;
    error?: string;
    feedback?: LineFeedback[];
}

export type ImportSuccessHandler = (message: WebSocketMessage<WSMessagePayload>) => void;
export type ImportErrorHandler = (message: WebSocketMessage<WSMessagePayload>) => void;
export type ImportDisconnectHandler = () => void;
export type ImportProgressHandler = (message: WebSocketMessage<WSMessagePayload>) => void;

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
    isVisited: number | null;
}

export interface ImportInfo {
    id: string;
    name: string;
    size: number;
    provider?: ImportProvider;
    separator: string;
    preview: string[][];
    step:
        | typeof ImportStepUpload
        | typeof ImportStepPreview
        | typeof ImportStepProgress
        | typeof ImportStepSuccess
        | typeof ImportStepError;
    totalRows: number;
    successfulRows: number;
    percentage: number;
    lineFeedback: LineFeedback[];
    globalError: string;
}

export const ImportStepUpload = 'upload';
export const ImportStepPreview = 'preview';
export const ImportStepProgress = 'in progress';
export const ImportStepSuccess = 'success';
export const ImportStepError = 'error';

export interface LineFeedback {
    line: number;
    text: string;
    severity: 'warning' | 'error';
}
