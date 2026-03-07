import type {Id} from '$convex/_generated/dataModel';
import type {ImportJobSnapshot, ImportProviderPayload} from '$lib/interfaces/import.ts';
import {
    ImportStepError,
    ImportStepPreview,
    ImportStepProgress,
    ImportStepSuccess,
    ImportStepUpload,
    type LineFeedback,
} from '$lib/interfaces/import.ts';
import {ImportProvider, type ConvexClientLike} from '$lib/services/importProvider.ts';

interface ImportState {
    id: string;
    name: string;
    size: number;
    provider: ImportProvider | null;
    separator: string;
    hasHeader: boolean;
    preview: string[][];
    parsedRows: string[][];
    rawCsvText: string;
    step:
        | typeof ImportStepUpload
        | typeof ImportStepPreview
        | typeof ImportStepProgress
        | typeof ImportStepSuccess
        | typeof ImportStepError;
    importJobId: Id<'importJobs'> | null;
    importJob: ImportJobSnapshot | null;
    totalRows: number;
    processedRows: number;
    successfulRows: number;
    percentage: number;
    lineFeedback: LineFeedback[];
    globalError: string;
}

export const importState = $state<ImportState>({
    id: '',
    name: '',
    size: 0,
    provider: null,
    separator: ';',
    hasHeader: true,
    preview: [],
    parsedRows: [],
    rawCsvText: '',
    step: 'upload',
    importJobId: null,
    importJob: null,
    totalRows: 0,
    processedRows: 0,
    successfulRows: 0,
    percentage: 0,
    lineFeedback: [],
    globalError: '',
});

export function resetImportState() {
    importState.id = '';
    importState.name = '';
    importState.size = 0;
    importState.provider = null;
    importState.separator = ';';
    importState.hasHeader = true;
    importState.preview = [];
    importState.parsedRows = [];
    importState.rawCsvText = '';
    importState.step = 'upload';
    importState.importJobId = null;
    importState.importJob = null;
    importState.totalRows = 0;
    importState.processedRows = 0;
    importState.successfulRows = 0;
    importState.percentage = 0;
    importState.lineFeedback = [];
    importState.globalError = '';
}

export function initializeImportProvider(client: ConvexClientLike) {
    const importProvider = new ImportProvider(client);
    importProvider.setErrorHandler(message => {
        importState.step = ImportStepError;
        importState.globalError = message.error ?? 'Импорт завершился с ошибкой';
    });
    importProvider.setProgressHandler(message => {
        applyProviderPayload(message);
    });
    importProvider.setDisconnectHandler(() => {
        importState.step = ImportStepError;
        importState.globalError = 'Пропало соединение с сервером';
    });

    importState.provider = importProvider;
    return importProvider;
}

function applyProviderPayload(message: ImportProviderPayload) {
    importState.totalRows = message.total;
    importState.successfulRows = message.successful;
    importState.processedRows = message.processed;
    importState.percentage = message.percentage;
}

export function applyImportJobSnapshot(job: ImportJobSnapshot | null) {
    importState.importJob = job;
    if (!job) {
        return;
    }

    importState.importJobId = job.id;
    importState.totalRows = job.totalRows;
    importState.processedRows = job.processedRows;
    importState.successfulRows = job.successfulRows;
    importState.percentage = job.percentage;
    importState.lineFeedback = job.feedback;
    importState.globalError = job.globalError ?? '';

    if (job.status === ImportStepSuccess) {
        importState.step = ImportStepSuccess;
    } else if (job.status === ImportStepError || job.status === 'cancelled') {
        importState.step = ImportStepError;
        if (job.status === 'cancelled' && !importState.globalError) {
            importState.globalError = 'Импорт был отменен';
        }
    } else if (job.status === 'running') {
        importState.step = ImportStepProgress;
    }
}
