import type {Id} from '$convex/_generated/dataModel';
import type {ImportProvider} from '$lib/services/importProvider';
import type {
    ImportJobStatus,
    ImportLineFeedback,
    ImportMappings,
    ImportMappingsForJob,
    NormalizedImportRow,
} from './importShared';

export interface ParsedCsvData {
    rows: string[][];
}

export interface ImportJobSnapshot {
    id: Id<'importJobs'>;
    status: ImportJobStatus;
    totalRows: number;
    processedRows: number;
    successfulRows: number;
    percentage: number;
    startedAt: number;
    finishedAt?: number;
    globalError?: string;
    feedback: ImportLineFeedback[];
}

export interface ImportProviderPayload {
    total: number;
    successful: number;
    processed: number;
    percentage: number;
    error?: string;
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
    lineFeedback: ImportLineFeedback[];
    globalError: string;
}

export const ImportStepUpload = 'upload';
export const ImportStepPreview = 'preview';
export const ImportStepProgress = 'in progress';
export const ImportStepSuccess = 'success';
export const ImportStepError = 'error';

export type LineFeedback = ImportLineFeedback;
export type {ImportMappings, ImportMappingsForJob, NormalizedImportRow};
