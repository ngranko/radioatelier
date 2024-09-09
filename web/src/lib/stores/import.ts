import {writable} from 'svelte/store';
import type {ImportInfo} from '$lib/interfaces/import';
import {ImportProvider} from '$lib/services/importProvider';

const initialValue = {
    id: '',
    separator: ';',
    currentStep: 1,
    preview: [],
    status: 'idle',
    percentage: 0,
    resultText: '',
    lineFeedback: [],
    globalError: '',
};

const {subscribe, set, update} = writable<ImportInfo>({
    ...initialValue,
    provider: initializeProvider(),
});

export const importInfo = {
    subscribe,
    set,
    update,
    reset: () => set({...initialValue, provider: initializeProvider()}),
};

function initializeProvider() {
    const importProvider = new ImportProvider();
    importProvider.setSuccessHandler(message =>
        importInfo.update(value => ({
            ...value,
            status: 'success',
            resultText: message.payload.text,
            lineFeedback: message.payload.feedback,
        })),
    );
    importProvider.setErrorHandler(message => {
        importInfo.update(value => ({
            ...value,
            status: 'error',
            globalError: message.payload.error,
        }));
    });
    importProvider.setProgressHandler(message =>
        importInfo.update(value => ({...value, percentage: message.payload.percentage})),
    );
    importProvider.setDisconnectHandler(() =>
        importInfo.update(value => ({
            ...value,
            status: 'error',
            globalError: 'Пропало соединение с сервером',
        })),
    );

    return importProvider;
}
