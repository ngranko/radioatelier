import type {ImportMappingsForJob, NormalizedImportRow} from '$lib/interfaces/import';

const EMPTY = '';

function getCell(cells: string[], index: number | null): string {
    if (index === null || index < 0 || index >= cells.length) {
        return EMPTY;
    }
    return cells[index] ?? EMPTY;
}

function splitTags(raw: string): string[] {
    if (!raw.trim()) {
        return [];
    }
    return raw
        .split(';')
        .map(item => item.trim())
        .filter(Boolean);
}

function toBoolean(raw: string): boolean {
    const normalized = raw.trim().toLowerCase();
    return ['1', 'true', 'yes', 'y', 'да'].includes(normalized);
}

function toOptional(raw: string): string | undefined {
    const value = raw.trim();
    return value || undefined;
}

export function normalizeRows(
    rows: string[][],
    mappings: ImportMappingsForJob,
    hasHeader: boolean,
): NormalizedImportRow[] {
    if (rows.length === 0 || (hasHeader && rows.length <= 1)) {
        return [];
    }

    const dataRows = hasHeader ? rows.slice(1) : rows;
    const lineOffset = hasHeader ? 2 : 1;
    return dataRows.map((cells, index) => {
        const imageSource = toOptional(getCell(cells, mappings.image));
        return {
            line: index + lineOffset,
            coordinates: getCell(cells, mappings.coordinates).trim(),
            name: getCell(cells, mappings.name).trim(),
            category: getCell(cells, mappings.category).trim(),
            isVisited: toBoolean(getCell(cells, mappings.isVisited)),
            isPublic: toBoolean(getCell(cells, mappings.isPublic)),
            isRemoved: toBoolean(getCell(cells, mappings.isRemoved)),
            tags: splitTags(getCell(cells, mappings.tags)),
            privateTags: splitTags(getCell(cells, mappings.privateTags)),
            address: toOptional(getCell(cells, mappings.address)),
            city: toOptional(getCell(cells, mappings.city)),
            country: toOptional(getCell(cells, mappings.country)),
            installedPeriod: toOptional(getCell(cells, mappings.installedPeriod)),
            removalPeriod: toOptional(getCell(cells, mappings.removalPeriod)),
            description: toOptional(getCell(cells, mappings.description)),
            source: toOptional(getCell(cells, mappings.source)),
            imageSource,
        };
    });
}
