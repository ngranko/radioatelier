import type {TaxonomyErrorCode} from '$lib/interfaces/taxonomy';
import {ConvexError} from 'convex/values';

const messages: Record<TaxonomyErrorCode, string> = {
    deletionInProgress: 'Запись удаляется. Выберите другую категорию или тег',
    migrationInProgress: 'В запись ещё переносятся объекты. Дождитесь завершения переноса',
    nameRequired: 'Название не может быть пустым',
    nameTaken: 'Такое название уже занято',
    notFound: 'Запись не найдена',
    categoryInUse: 'Категория ещё используется объектами',
    selfReplacement: 'Нельзя перенести объекты в удаляемую запись',
};

export function describeTaxonomyError(error: unknown) {
    const code =
        error instanceof ConvexError
            ? (error.data as {code?: TaxonomyErrorCode} | null)?.code
            : undefined;
    return (code && messages[code]) || 'Не удалось выполнить действие';
}
