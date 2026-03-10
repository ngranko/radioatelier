import type {Id} from '$convex/_generated/dataModel';
import type {
    ImportJobStatus,
    ImportLineFeedback,
    ImportMappings,
    ImportMappingsForJob,
    NormalizedImportRow,
} from './importShared';

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

export const ImportStepUpload = 'upload';
export const ImportStepPreview = 'preview';
export const ImportStepProgress = 'in progress';
export const ImportStepSuccess = 'success';
export const ImportStepError = 'error';

export type LineFeedback = ImportLineFeedback;
export type {ImportMappings, ImportMappingsForJob, NormalizedImportRow};
