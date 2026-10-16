const messages: Record<string, string> = {
    'Taxonomy name is required': 'Название не может быть пустым',
    'Taxonomy name is already taken': 'Такое название уже занято',
    'Taxonomy not found': 'Запись не найдена',
    'Category is still in use': 'Категория ещё используется объектами',
    'A taxonomy cannot replace itself': 'Нельзя перенести объекты в удаляемую запись',
    'Private tags can only be merged within one owner':
        'Приватные теги объединяются только внутри одного владельца',
    Forbidden: 'Недостаточно прав',
};

export function describeTaxonomyError(error: unknown) {
    const data = (error as {data?: unknown})?.data;
    return (typeof data === 'string' && messages[data]) || 'Не удалось выполнить действие';
}
