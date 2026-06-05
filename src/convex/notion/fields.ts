import type {NotionDataSource, NotionPage, NotionPageFields, NotionPropertySchema} from './types';

export const notionPropertyNames = {
    name: 'Название',
    categoryName: 'Тип',
    address: 'Адрес',
    city: 'Город',
    country: 'Страна',
    mapLink: 'Ссылка на архив',
    internalId: 'internal_id',
    installedPeriod: 'Период установки',
    isRemoved: 'Демонтирован',
    removalPeriod: 'Период демонтажа',
    tagNames: 'Теги',
    isVisited: 'Посещен',
    source: 'Источник',
} as const;

type WritableField = keyof NotionPageFields;

type NotionPropertyValue = {
    type?: string;
    [key: string]: unknown;
};

const READ_ONLY_NOTION_PROPERTY_TYPES = new Set([
    'created_by',
    'created_time',
    'formula',
    'last_edited_by',
    'last_edited_time',
    'place',
    'rollup',
    'unique_id',
]);

export function readNotionPageFields(page: NotionPage): NotionPageFields {
    const properties = page.properties ?? {};
    return {
        name: readStringProperty(properties[notionPropertyNames.name]),
        categoryName: readStringProperty(properties[notionPropertyNames.categoryName]),
        address: readStringProperty(properties[notionPropertyNames.address]),
        city: readStringProperty(properties[notionPropertyNames.city]),
        country: readStringProperty(properties[notionPropertyNames.country]),
        mapLink: readStringProperty(properties[notionPropertyNames.mapLink]),
        internalId: readStringProperty(properties[notionPropertyNames.internalId]),
        installedPeriod: readStringProperty(properties[notionPropertyNames.installedPeriod]),
        isRemoved: readCheckboxProperty(properties[notionPropertyNames.isRemoved]),
        removalPeriod: readStringProperty(properties[notionPropertyNames.removalPeriod]),
        tagNames: readMultiSelectProperty(properties[notionPropertyNames.tagNames]),
        isVisited: readCheckboxProperty(properties[notionPropertyNames.isVisited]),
        source: readStringProperty(properties[notionPropertyNames.source]),
    };
}

export function buildNotionPropertiesPayload(
    dataSource: NotionDataSource,
    fields: Partial<NotionPageFields>,
) {
    const payload: Record<string, unknown> = {};
    for (const key of Object.keys(notionPropertyNames) as WritableField[]) {
        const value = fields[key];
        if (value === undefined) {
            continue;
        }
        const propertyName = notionPropertyNames[key];
        const propertySchema = dataSource.properties[propertyName];
        if (!propertySchema?.type) {
            throw new Error(`Missing Notion property schema for "${propertyName}"`);
        }
        if (READ_ONLY_NOTION_PROPERTY_TYPES.has(propertySchema.type)) {
            continue;
        }
        payload[propertyName] = buildPropertyValue(propertySchema, value);
    }
    return payload;
}

function buildPropertyValue(schema: NotionPropertySchema, value: NotionPageFields[WritableField]) {
    switch (schema.type) {
        case 'title':
            return {title: toRichTextArray(asNullableString(value))};
        case 'rich_text':
            return {rich_text: toRichTextArray(asNullableString(value))};
        case 'url':
            return {url: asNullableString(value)};
        case 'select':
            return {select: toSelectOption(asNullableString(value))};
        case 'status':
            return {status: toSelectOption(asNullableString(value))};
        case 'multi_select':
            return {
                multi_select: Array.isArray(value)
                    ? value.map(toSelectOption).filter(option => Boolean(option))
                    : [],
            };
        case 'checkbox':
            return {checkbox: value === true};
        default:
            throw new Error(`Unsupported Notion property type "${schema.type}"`);
    }
}

function asNullableString(value: NotionPageFields[WritableField]) {
    return readNullableString(value);
}

function toSelectOption(value: unknown) {
    return value && typeof value === 'string' ? {name: value} : null;
}

function toRichTextArray(value: string | null) {
    if (!value) {
        return [];
    }
    return [{text: {content: value.slice(0, 2000)}}];
}

function readStringProperty(property: unknown) {
    const value = property as NotionPropertyValue | undefined;
    if (!value?.type) {
        return null;
    }
    switch (value.type) {
        case 'title':
            return joinPlainText(readArray(value.title));
        case 'rich_text':
            return joinPlainText(readArray(value.rich_text));
        case 'url':
        case 'email':
        case 'phone_number':
            return readNullableString(value[value.type]);
        case 'select':
        case 'status':
            return readNullableString(readObjectValue(value[value.type], 'name'));
        default:
            return null;
    }
}

function readMultiSelectProperty(property: unknown) {
    const value = property as NotionPropertyValue | undefined;
    if (value?.type !== 'multi_select') {
        return [];
    }
    return readArray(value.multi_select)
        .map(item => readNullableString(readObjectValue(item, 'name')))
        .filter((item): item is string => Boolean(item));
}

function readCheckboxProperty(property: unknown) {
    const value = property as NotionPropertyValue | undefined;
    if (value?.type !== 'checkbox') {
        return false;
    }
    return value.checkbox === true;
}

function joinPlainText(items: unknown[]) {
    const text = items
        .map(item => readObjectValue(item, 'plain_text'))
        .filter((item): item is string => typeof item === 'string')
        .join('')
        .trim();
    return text || null;
}

function readArray(value: unknown) {
    return Array.isArray(value) ? value : [];
}

function readObjectValue(value: unknown, key: string) {
    if (!value || typeof value !== 'object') {
        return null;
    }
    return (value as Record<string, unknown>)[key] ?? null;
}

function readNullableString(value: unknown) {
    if (typeof value !== 'string') {
        return null;
    }
    const normalized = value.trim();
    return normalized || null;
}
