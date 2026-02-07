/**
 * Data transformer for MySQL to Convex migration
 * Maps MySQL columns to Convex schema fields
 */

import {hexToUlid, mysqlTimestampToMs, type ParsedTable} from './parse-sql';
import {getVisitedChunkId} from '../../src/convex/utils/visitedChunks';

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
const toUlid = (value: unknown): string => hexToUlid(String(value));

const resolveConvexId = (
    targetMapping: Record<string, string> | undefined,
    mysqlId: string,
): string | null => {
    if (!targetMapping) return null;
    const normalized = mysqlId.toLowerCase();
    return (
        targetMapping[normalized] ||
        targetMapping[normalized.toUpperCase()] ||
        Object.entries(targetMapping).find(([key]) => key.toLowerCase() === normalized)?.[1] ||
        null
    );
};

// Table transformation configs
const transformConfigs: TransformConfig[] = [
    {
        tableName: 'categories',
        convexTable: 'categories',
        columns: [
            {mysql: 'id', convex: 'mysqlId', transform: toUlid},
            {mysql: 'name', convex: 'name'},
        ],
    },
    {
        tableName: 'tags',
        convexTable: 'tags',
        columns: [
            {mysql: 'id', convex: 'mysqlId', transform: toUlid},
            {mysql: 'name', convex: 'name'},
        ],
    },
    {
        tableName: 'images',
        convexTable: 'images',
        columns: [
            {mysql: 'id', convex: 'mysqlId', transform: toUlid},
            {mysql: 'link', convex: 'url'},
            {mysql: 'preview_link', convex: 'previewUrl', transform: toNullableString},
        ],
    },
    {
        tableName: 'map_points',
        convexTable: 'mapPoints',
        columns: [
            {mysql: 'id', convex: 'mysqlId', transform: toUlid},
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
            {mysql: 'id', convex: 'mysqlId', transform: toUlid},
            {mysql: 'name', convex: 'name'},
        ],
        foreignKeys: [{mysql: 'created_by', convex: 'createdById', targetTable: 'users'}],
    },
    {
        tableName: 'objects',
        convexTable: 'objects',
        columns: [
            {mysql: 'id', convex: 'mysqlId', transform: toUlid},
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
        tableName: 'object_private_tags',
        convexTable: 'objectPrivateTags',
        columns: [],
        foreignKeys: [
            {mysql: 'object_id', convex: 'objectId', targetTable: 'objects'},
            {mysql: 'private_tag_id', convex: 'privateTagId', targetTable: 'privateTags'},
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
        'object_private_tags',
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
    parsedTables?: Map<string, ParsedTable>,
): {convexTable: string; records: Record<string, unknown>[]} | null {
    const config = getTransformConfig(parsedTable.tableName);
    if (!config) {
        console.warn(`No transform config for table: ${parsedTable.tableName}`);
        return null;
    }

    const records: Record<string, unknown>[] = [];
    const shouldMapTags = parsedTable.tableName === 'objects';
    const tagMappings = shouldMapTags ? idMappings.tags : undefined;
    const objectTagMap = shouldMapTags ? buildObjectTagMap(parsedTables) : null;

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

                const convexId = resolveConvexId(targetMapping, mysqlId);
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

        if (shouldMapTags) {
            const mysqlObjectId = row.id ? hexToUlid(row.id as string).toLowerCase() : null;
            const mysqlTagIds = mysqlObjectId ? (objectTagMap?.get(mysqlObjectId) ?? []) : [];
            const resolvedTagIds = new Set<string>();

            for (const mysqlTagId of mysqlTagIds) {
                const convexId = resolveConvexId(tagMappings, mysqlTagId);
                if (!convexId) {
                    console.warn(`Tag ID not found: ${mysqlTagId} for object ${mysqlObjectId}`);
                    continue;
                }
                resolvedTagIds.add(convexId);
            }

            record.tagIds = [...resolvedTagIds];
        }

        records.push(record);
    }

    return {convexTable: config.convexTable, records};
}

export function transformMarkersFromObjects(
    parsedTables: Map<string, ParsedTable>,
    idMappings: IdMapping,
): {convexTable: 'markers'; records: Record<string, unknown>[]} {
    const objectsTable = parsedTables.get('objects');
    const mapPointsTable = parsedTables.get('map_points');

    if (!objectsTable || !mapPointsTable) {
        return {convexTable: 'markers', records: []};
    }

    const mapPointLookup = new Map<string, {latitude: number; longitude: number}>();
    for (const row of mapPointsTable.rows) {
        if (!row.id) continue;
        const mysqlId = hexToUlid(row.id as string).toLowerCase();
        mapPointLookup.set(mysqlId, {
            latitude: toNumber(row.latitude),
            longitude: toNumber(row.longitude),
        });
    }

    const tagMappings = idMappings.tags;
    const categoryMapping = idMappings.categories;
    const userMapping = idMappings.users;
    const objectTagMap = buildObjectTagMap(parsedTables);

    const records: Record<string, unknown>[] = [];

    for (const row of objectsTable.rows) {
        if (!row.map_point_id || !row.created_by || !row.category_id) {
            console.warn('Skipping marker: missing map point, creator, or category');
            continue;
        }

        const mysqlMapPointId = hexToUlid(row.map_point_id as string).toLowerCase();
        const mapPoint = mapPointLookup.get(mysqlMapPointId);
        if (!mapPoint) {
            console.warn(`Skipping marker: map point not found ${mysqlMapPointId}`);
            continue;
        }

        const mysqlUserId = hexToUlid(row.created_by as string).toLowerCase();
        const mysqlCategoryId = hexToUlid(row.category_id as string).toLowerCase();
        const createdById = resolveConvexId(userMapping, mysqlUserId);
        const categoryId = resolveConvexId(categoryMapping, mysqlCategoryId);

        if (!createdById || !categoryId) {
            console.warn(
                `Skipping marker: missing user/category mapping user=${mysqlUserId} category=${mysqlCategoryId}`,
            );
            continue;
        }

        const mysqlObjectId = row.id ? hexToUlid(row.id as string).toLowerCase() : null;
        const mysqlTagIds = mysqlObjectId ? (objectTagMap?.get(mysqlObjectId) ?? []) : [];
        const resolvedTagIds: string[] = [];

        for (const mysqlTagId of mysqlTagIds) {
            const convexId = resolveConvexId(tagMappings, mysqlTagId);
            if (!convexId) {
                console.warn(`Tag ID not found: ${mysqlTagId} for object ${mysqlObjectId}`);
                continue;
            }
            resolvedTagIds.push(convexId);
        }

        records.push({
            latitude: mapPoint.latitude,
            longitude: mapPoint.longitude,
            createdById,
            categoryId,
            tagIds: resolvedTagIds,
            isRemoved: toBoolean(row.is_removed),
        });
    }

    return {convexTable: 'markers', records};
}

function buildObjectTagMap(parsedTables?: Map<string, ParsedTable>): Map<string, string[]> | null {
    if (!parsedTables) return null;
    const objectTags = parsedTables.get('object_tags');
    if (!objectTags) return null;

    const map = new Map<string, string[]>();
    for (const row of objectTags.rows) {
        if (!row.object_id || !row.tag_id) continue;
        const mysqlObjectId = hexToUlid(row.object_id as string).toLowerCase();
        const mysqlTagId = hexToUlid(row.tag_id as string).toLowerCase();
        const existing = map.get(mysqlObjectId);
        if (existing) {
            existing.push(mysqlTagId);
        } else {
            map.set(mysqlObjectId, [mysqlTagId]);
        }
    }

    return map;
}

export function transformVisitedChunksFromObjectUsers(
    parsedTable: ParsedTable,
    idMappings: IdMapping,
): {convexTable: string; records: Record<string, unknown>[]} {
    const objectMapping = idMappings.objects;
    const userMapping = idMappings.users;
    const grouped = new Map<string, {userId: string; chunkId: string; objectIds: Set<string>}>();

    for (const row of parsedTable.rows) {
        if (!row.object_id || !row.user_id) continue;
        if (!toBoolean(row.is_visited)) continue;

        const mysqlObjectId = hexToUlid(row.object_id as string).toLowerCase();
        const mysqlUserId = hexToUlid(row.user_id as string).toLowerCase();
        const convexObjectId = resolveConvexId(objectMapping, mysqlObjectId);
        const convexUserId = resolveConvexId(userMapping, mysqlUserId);

        if (!convexObjectId || !convexUserId) {
            console.warn(
                `Visited chunk mapping missing: object=${mysqlObjectId} user=${mysqlUserId}`,
            );
            continue;
        }

        const chunkId = getVisitedChunkId(convexObjectId);
        const key = `${convexUserId}:${chunkId}`;
        const entry = grouped.get(key);

        if (entry) {
            entry.objectIds.add(convexObjectId);
        } else {
            grouped.set(key, {
                userId: convexUserId,
                chunkId,
                objectIds: new Set([convexObjectId]),
            });
        }
    }

    const records = [...grouped.values()].map(entry => ({
        userId: entry.userId,
        chunkId: entry.chunkId,
        visitedObjectIds: [...entry.objectIds],
    }));

    return {convexTable: 'userVisitedChunks', records};
}

/**
 * Convert records to JSONL format
 */
export function toJsonl(records: Record<string, unknown>[]): string {
    return records.map(r => JSON.stringify(r)).join('\n');
}
