/**
 * Data transformer for MySQL to Convex migration
 * Maps MySQL columns to Convex schema fields
 */

import {hexToUlid, mysqlTimestampToMs, type ParsedTable} from './parse-sql';

export type IdMapping = Record<string, Record<string, string>>;

interface TransformConfig {
    tableName: string;
    convexTable: string;
    columns: ColumnMapping[];
    foreignKeys?: ForeignKeyMapping[];
}

interface ColumnMapping {
    mysql: string;
    convex: string;
    transform?: (value: unknown) => unknown;
}

interface ForeignKeyMapping {
    mysql: string;
    convex: string;
    targetTable: string;
    nullable?: boolean;
}

// Standard transformations
const toBoolean = (value: unknown): boolean => value === 1 || value === '1' || value === true;
const toNumber = (value: unknown): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value);
    return 0;
};
const toNullableString = (value: unknown): string | null => {
    if (value === null || value === undefined) return null;
    return String(value);
};

// Table transformation configs
const transformConfigs: TransformConfig[] = [
    {
        tableName: 'categories',
        convexTable: 'categories',
        columns: [
            {mysql: 'id', convex: 'mysqlId', transform: hexToUlid},
            {mysql: 'name', convex: 'name'},
        ],
    },
    {
        tableName: 'tags',
        convexTable: 'tags',
        columns: [
            {mysql: 'id', convex: 'mysqlId', transform: hexToUlid},
            {mysql: 'name', convex: 'name'},
        ],
    },
    {
        tableName: 'images',
        convexTable: 'images',
        columns: [
            {mysql: 'id', convex: 'mysqlId', transform: hexToUlid},
            {mysql: 'link', convex: 'url'},
            {mysql: 'preview_link', convex: 'previewUrl', transform: toNullableString},
        ],
    },
    {
        tableName: 'map_points',
        convexTable: 'mapPoints',
        columns: [
            {mysql: 'id', convex: 'mysqlId', transform: hexToUlid},
            {mysql: 'latitude', convex: 'latitude', transform: toNumber},
            {mysql: 'longitude', convex: 'longitude', transform: toNumber},
            {mysql: 'address', convex: 'address', transform: v => v ?? ''},
            {mysql: 'city', convex: 'city', transform: v => v ?? ''},
            {mysql: 'country', convex: 'country', transform: v => v ?? ''},
        ],
    },
    {
        tableName: 'private_tags',
        convexTable: 'privateTags',
        columns: [
            {mysql: 'id', convex: 'mysqlId', transform: hexToUlid},
            {mysql: 'name', convex: 'name'},
        ],
        foreignKeys: [{mysql: 'created_by', convex: 'createdById', targetTable: 'users'}],
    },
    {
        tableName: 'objects',
        convexTable: 'objects',
        columns: [
            {mysql: 'id', convex: 'mysqlId', transform: hexToUlid},
            {mysql: 'name', convex: 'name'},
            {mysql: 'description', convex: 'description', transform: toNullableString},
            {mysql: 'installed_period', convex: 'installedPeriod', transform: toNullableString},
            {mysql: 'is_removed', convex: 'isRemoved', transform: toBoolean},
            {mysql: 'removal_period', convex: 'removalPeriod', transform: toNullableString},
            {mysql: 'source', convex: 'source', transform: toNullableString},
            {mysql: 'is_public', convex: 'isPublic', transform: toBoolean},
            {mysql: 'internal_id', convex: 'internalId'},
        ],
        foreignKeys: [
            {mysql: 'category_id', convex: 'categoryId', targetTable: 'categories'},
            {mysql: 'map_point_id', convex: 'mapPointId', targetTable: 'mapPoints'},
            {mysql: 'cover_id', convex: 'coverId', targetTable: 'images', nullable: true},
            {mysql: 'created_by', convex: 'createdById', targetTable: 'users'},
        ],
    },
    {
        tableName: 'object_tags',
        convexTable: 'objectTags',
        columns: [],
        foreignKeys: [
            {mysql: 'object_id', convex: 'objectId', targetTable: 'objects'},
            {mysql: 'tag_id', convex: 'tagId', targetTable: 'tags'},
        ],
    },
    {
        tableName: 'object_private_tags',
        convexTable: 'objectPrivateTags',
        columns: [],
        foreignKeys: [
            {mysql: 'object_id', convex: 'objectId', targetTable: 'objects'},
            {mysql: 'private_tag_id', convex: 'privateTagId', targetTable: 'privateTags'},
        ],
    },
    {
        tableName: 'object_users',
        convexTable: 'objectUsers',
        columns: [{mysql: 'is_visited', convex: 'isVisited', transform: toBoolean}],
        foreignKeys: [
            {mysql: 'object_id', convex: 'objectId', targetTable: 'objects'},
            {mysql: 'user_id', convex: 'userId', targetTable: 'users'},
        ],
    },
];

/**
 * Get the transformation config for a MySQL table
 */
export function getTransformConfig(mysqlTableName: string): TransformConfig | undefined {
    return transformConfigs.find(c => c.tableName === mysqlTableName);
}

/**
 * Get all table names that need to be imported
 */
export function getImportOrder(): string[] {
    return [
        'categories',
        'tags',
        'images',
        'map_points',
        'private_tags',
        'objects',
        'object_tags',
        'object_private_tags',
        'object_users',
    ];
}

/**
 * Get tables without foreign keys (can be imported first)
 */
export function getTablesWithoutFKs(): string[] {
    return transformConfigs
        .filter(c => !c.foreignKeys || c.foreignKeys.length === 0)
        .map(c => c.tableName);
}

/**
 * Transform a parsed MySQL table to Convex format
 */
export function transformTable(
    parsedTable: ParsedTable,
    idMappings: IdMapping,
): {convexTable: string; records: Record<string, unknown>[]} | null {
    const config = getTransformConfig(parsedTable.tableName);
    if (!config) {
        console.warn(`No transform config for table: ${parsedTable.tableName}`);
        return null;
    }

    const records: Record<string, unknown>[] = [];

    for (const row of parsedTable.rows) {
        const record: Record<string, unknown> = {};

        // Transform regular columns
        for (const col of config.columns) {
            const value = row[col.mysql];
            record[col.convex] = col.transform ? col.transform(value) : value;
        }

        // Transform _creationTime from created_at
        if ('created_at' in row) {
            record._creationTime = mysqlTimestampToMs(row.created_at as string);
        }

        // Transform foreign keys
        if (config.foreignKeys) {
            let skipRecord = false;
            for (const fk of config.foreignKeys) {
                const mysqlFkValue = row[fk.mysql];

                if (mysqlFkValue === null || mysqlFkValue === undefined) {
                    if (fk.nullable) {
                        record[fk.convex] = null;
                    } else {
                        console.warn(
                            `Skipping record: required FK ${fk.mysql} is null in ${parsedTable.tableName}`,
                        );
                        skipRecord = true;
                        break;
                    }
                    continue;
                }

                const mysqlId = hexToUlid(mysqlFkValue as string).toLowerCase();
                const targetMapping = idMappings[fk.targetTable];

                if (!targetMapping) {
                    console.error(
                        `No ID mapping for target table: ${fk.targetTable}. Make sure to import it first.`,
                    );
                    skipRecord = true;
                    break;
                }

                // Case-insensitive lookup - normalize both sides to lowercase
                const convexId =
                    targetMapping[mysqlId] ||
                    targetMapping[mysqlId.toUpperCase()] ||
                    Object.entries(targetMapping).find(
                        ([key]) => key.toLowerCase() === mysqlId,
                    )?.[1];
                if (!convexId) {
                    console.warn(
                        `FK not found: ${fk.mysql}=${mysqlId} -> ${fk.targetTable} in ${parsedTable.tableName}`,
                    );
                    if (!fk.nullable) {
                        skipRecord = true;
                        break;
                    }
                    record[fk.convex] = null;
                } else {
                    record[fk.convex] = convexId;
                }
            }

            if (skipRecord) continue;
        }

        records.push(record);
    }

    return {convexTable: config.convexTable, records};
}

/**
 * Convert records to JSONL format
 */
export function toJsonl(records: Record<string, unknown>[]): string {
    return records.map(r => JSON.stringify(r)).join('\n');
}
