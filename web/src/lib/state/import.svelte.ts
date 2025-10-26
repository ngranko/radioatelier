import {
    ImportStepError,
    ImportStepPreview,
    ImportStepProgress,
    ImportStepSuccess,
    ImportStepUpload,
    type LineFeedback,
} from '$lib/interfaces/import.ts';
import {ImportProvider} from '$lib/services/importProvider.ts';

interface ImportState {
    id: string;
    name: string;
    size: number;
    provider: ImportProvider;
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

export const importState = $state<ImportState>({
    id: '',
    name: '',
    size: 0,
    provider: initializeImportProvider(),
    separator: ';',
    preview: [],
    step: 'upload',
    totalRows: 0,
    successfulRows: 0,
    percentage: 0,
    lineFeedback: [],
    globalError: '',
});

export function resetImportState() {
    importState.id = '';
    importState.name = '';
    importState.size = 0;
    importState.provider = initializeImportProvider();
    importState.separator = ';';
    importState.preview = [];
    importState.step = 'upload';
    importState.totalRows = 0;
    importState.successfulRows = 0;
    importState.percentage = 0;
    importState.lineFeedback = [];
    importState.globalError = '';
}

function initializeImportProvider() {
    const importProvider = new ImportProvider();
    importProvider.setSuccessHandler(message => {
        importState.step = ImportStepSuccess;
        importState.totalRows = message.payload.total;
        importState.successfulRows = message.payload.successful;
        importState.percentage = message.payload.percentage;
        importState.lineFeedback = message.payload.feedback!;
    });
    importProvider.setErrorHandler(message => {
        importState.step = ImportStepError;
        importState.totalRows = message.payload.total;
        importState.successfulRows = message.payload.successful;
        importState.percentage = message.payload.percentage;
        importState.globalError = message.payload.error!;
    });
    importProvider.setProgressHandler(message => {
        importState.totalRows = message.payload.total;
        importState.successfulRows = message.payload.successful;
        importState.percentage = message.payload.percentage;
    });
    importProvider.setDisconnectHandler(() => {
        importState.step = ImportStepError;
        importState.globalError = 'Пропало соединение с сервером';
    });

    return importProvider;
}
