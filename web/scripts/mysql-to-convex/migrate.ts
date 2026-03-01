/**
 * MySQL to Convex Migration Script
 *
 * Usage: bun run scripts/mysql-to-convex/migrate.ts <path-to-sql-dump> [--prod]
 *
 * This script:
 * 1. Parses a MySQL dump file
 * 2. Transforms data to match Convex schema
 * 3. Imports tables in dependency order via `npx convex import`
 * 4. Resolves foreign keys by querying Convex for ID mappings
 *
 * Options:
 *   --prod    Import into production deployment instead of dev
 *   --uploads-host <url>   Base host used for /uploads/... references
 *   --uploads-insecure   Skip TLS validation for image downloads
 */

import {access, mkdir, readFile, writeFile} from 'node:fs/promises';
import * as http from 'node:http';
import * as https from 'node:https';
import {dirname, isAbsolute, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {hexToUlid, parseSqlDump, type ParsedTable} from './parse-sql';
import {
    getTransformConfig,
    toJsonl,
    transformMarkersFromObjects,
    transformTable,
    transformVisitedChunksFromObjectUsers,
    type IdMapping,
    type ImageStorageMapping,
} from './transform';

const OUTPUT_DIR = join(dirname(fileURLToPath(import.meta.url)), 'output');

// Will be set based on --prod flag
let useProd = false;
let uploadsHost: string | null = null;
let uploadsInsecure = false;

// Import order based on foreign key dependencies
const IMPORT_PHASES = [
    // Phase 1: Tables without foreign keys
    {
        phase: 1,
        tables: ['categories', 'tags', 'images', 'map_points'],
        description: 'Tables without foreign keys',
    },
    // Phase 2: Tables with FKs to phase 1 tables + users
    {
        phase: 2,
        tables: ['private_tags', 'objects'],
        description: 'Tables with foreign keys to base tables',
    },
    // Phase 3: Junction tables
    {
        phase: 3,
        tables: ['object_private_tags', 'object_users'],
        description: 'Junction tables',
    },
];

function parseConvexRunJson(output: string): unknown {
    const trimmed = output.trim();
    if (!trimmed) {
        throw new Error('Could not parse JSON from empty convex run output');
    }

    try {
        return JSON.parse(trimmed);
    } catch {
        // Continue with extraction heuristics for mixed stdout.
    }

    const jsonStart = trimmed.indexOf('{');
    const jsonEnd = trimmed.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const candidate = trimmed.slice(jsonStart, jsonEnd + 1);
        try {
            return JSON.parse(candidate);
        } catch {
            // Fall through to line-based fallback.
        }
    }

    const lines = trimmed
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
        try {
            return JSON.parse(lines[i]);
        } catch {
            // Keep scanning previous lines until we find JSON payload.
        }
    }

    throw new Error(`Could not parse JSON from convex run output: ${output}`);
}

async function generateMigrationUploadUrl(): Promise<string> {
    const result = useProd
        ? await Bun.$`npx convex run --prod migrations:generateMigrationUploadUrl`.quiet().nothrow()
        : await Bun.$`npx convex run migrations:generateMigrationUploadUrl`.quiet().nothrow();

    if (result.exitCode !== 0) {
        console.error('Failed to generate upload URL:', result.stderr.toString());
        throw new Error('Failed to generate upload URL');
    }

    const payload = parseConvexRunJson(result.stdout.toString().trim());
    if (typeof payload !== 'string') {
        throw new Error('Unexpected generateMigrationUploadUrl response payload');
    }
    return payload;
}

function normalizePathReference(reference: string, dumpDir: string): string[] {
    const trimmed = reference.trim();
    if (trimmed.startsWith('file://')) {
        return [fileURLToPath(trimmed)];
    }

    const candidates = new Set<string>();
    if (isAbsolute(trimmed)) {
        candidates.add(trimmed);
        candidates.add(resolve(dumpDir, trimmed.slice(1)));
    } else {
        candidates.add(resolve(dumpDir, trimmed));
    }

    return [...candidates];
}

function normalizeUploadsHost(host: string): string {
    const normalized = host.trim().replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(normalized)) {
        throw new Error(`Invalid uploads host (must start with http:// or https://): ${host}`);
    }
    return normalized;
}

function parseBoolEnv(value: string | undefined): boolean {
    if (!value) return false;
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

async function fetchRemoteBytes(
    targetUrl: string,
    insecureTls: boolean,
): Promise<{ok: boolean; status: number; bytes?: Uint8Array; contentType?: string}> {
    if (!insecureTls || !targetUrl.startsWith('https://')) {
        const response = await fetch(targetUrl);
        if (!response.ok) {
            return {ok: false, status: response.status};
        }
        const bytes = new Uint8Array(await response.arrayBuffer());
        const contentType =
            response.headers.get('content-type')?.split(';')[0] ?? 'application/octet-stream';
        return {ok: true, status: response.status, bytes, contentType};
    }

    const url = new URL(targetUrl);
    const client = url.protocol === 'http:' ? http : https;

    return await new Promise((resolvePromise, rejectPromise) => {
        const req = client.request(
            url,
            {
                method: 'GET',
                ...(url.protocol === 'https:' ? {rejectUnauthorized: false} : {}),
            },
            response => {
                const chunks: Buffer[] = [];
                response.on('data', chunk => chunks.push(Buffer.from(chunk)));
                response.on('end', () => {
                    const status = response.statusCode ?? 0;
                    if (status < 200 || status >= 300) {
                        resolvePromise({ok: false, status});
                        return;
                    }

                    const contentTypeHeader = response.headers['content-type'];
                    const contentType = Array.isArray(contentTypeHeader)
                        ? contentTypeHeader[0]
                        : contentTypeHeader;
                    const bytes = new Uint8Array(Buffer.concat(chunks));
                    resolvePromise({
                        ok: true,
                        status,
                        bytes,
                        contentType: contentType?.split(';')[0] ?? 'application/octet-stream',
                    });
                });
            },
        );

        req.on('error', rejectPromise);
        req.end();
    });
}

async function tryReadLocalReference(
    reference: string,
    dumpDir: string,
): Promise<{bytes: Uint8Array; contentType: string} | null> {
    const candidates = normalizePathReference(reference, dumpDir);

    for (const candidate of candidates) {
        try {
            await access(candidate);
            const file = Bun.file(candidate);
            const buffer = await file.arrayBuffer();
            return {
                bytes: new Uint8Array(buffer),
                contentType: file.type || 'application/octet-stream',
            };
        } catch {
            // Try the next candidate path.
        }
    }

    return null;
}

async function readFileReference(
    reference: unknown,
    dumpDir: string,
): Promise<{bytes: Uint8Array; contentType: string}> {
    if (typeof reference !== 'string' || reference.trim() === '') {
        throw new Error('Image reference is empty');
    }

    const normalized = reference.trim();
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
        const response = await fetchRemoteBytes(normalized, uploadsInsecure);
        if (!response.ok || !response.bytes) {
            throw new Error(`Failed to fetch image from URL (${response.status}): ${normalized}`);
        }
        return {
            bytes: response.bytes,
            contentType: response.contentType ?? 'application/octet-stream',
        };
    }

    if (normalized.startsWith('/') && uploadsHost) {
        const webUrl = `${uploadsHost}${normalized}`;
        const response = await fetchRemoteBytes(webUrl, uploadsInsecure);
        if (response.ok && response.bytes) {
            return {
                bytes: response.bytes,
                contentType: response.contentType ?? 'application/octet-stream',
            };
        }
        console.warn(
            `Could not fetch ${webUrl} (${response.status}). Falling back to local path resolution...`,
        );
    }

    const local = await tryReadLocalReference(normalized, dumpDir);
    if (!local) {
        throw new Error(
            `Image file not found for reference: ${normalized}. ` +
                `Provide --uploads-host <url> (or MIGRATION_UPLOADS_HOST) for web paths like /uploads/...`,
        );
    }

    return local;
}

async function uploadBytesToConvexStorage(bytes: Uint8Array, contentType: string): Promise<string> {
    const uploadUrl = await generateMigrationUploadUrl();
    const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
            'Content-Type': contentType || 'application/octet-stream',
        },
        body: Buffer.from(bytes),
    });

    if (!response.ok) {
        throw new Error(`Convex upload failed (${response.status} ${response.statusText})`);
    }

    const payload = (await response.json()) as {storageId?: string};
    if (!payload.storageId) {
        throw new Error('Convex upload response is missing storageId');
    }
    return payload.storageId;
}

async function uploadImagesFromDump(
    imagesTable: ParsedTable,
    sqlDumpPath: string,
): Promise<ImageStorageMapping> {
    const mapping: ImageStorageMapping = {};
    const dumpDir = dirname(resolve(sqlDumpPath));
    let uploaded = 0;

    for (const row of imagesTable.rows) {
        if (!row.id) {
            console.warn('Skipping image row: missing id');
            continue;
        }

        const mysqlId = hexToUlid(String(row.id)).toLowerCase();
        const originalReference = row.link;
        if (typeof originalReference !== 'string' || originalReference.trim() === '') {
            throw new Error(`Image ${mysqlId} is missing required original file reference`);
        }

        const originalFile = await readFileReference(originalReference, dumpDir);
        const originalStorageId = await uploadBytesToConvexStorage(
            originalFile.bytes,
            originalFile.contentType,
        );

        let previewStorageId: string | undefined;
        if (typeof row.preview_link === 'string' && row.preview_link.trim() !== '') {
            const previewFile = await readFileReference(row.preview_link, dumpDir);
            previewStorageId = await uploadBytesToConvexStorage(
                previewFile.bytes,
                previewFile.contentType,
            );
        }

        mapping[mysqlId] = {
            originalStorageId,
            ...(previewStorageId ? {previewStorageId} : {}),
        };

        uploaded += 1;
        if (uploaded % 25 === 0 || uploaded === imagesTable.rows.length) {
            console.log(`  Uploaded ${uploaded}/${imagesTable.rows.length} images to storage`);
        }
    }

    return mapping;
}

/**
 * Fetch ID mappings from Convex
 */
async function fetchIdMappings(tables: string[]): Promise<IdMapping> {
    console.log(`\nFetching ID mappings for: ${tables.join(', ')}...`);

    // Map MySQL table names to Convex table names
    const convexTables = tables.map(t => {
        const config = getTransformConfig(t);
        return config?.convexTable ?? t;
    });

    // Add 'users' to the list since it's already imported
    if (!convexTables.includes('users')) {
        convexTables.push('users');
    }

    const arg = JSON.stringify({tables: convexTables});

    // Use Bun's shell which handles escaping properly
    const result = useProd
        ? await Bun.$`npx convex run --prod migrations:getIdMappings ${arg}`.quiet().nothrow()
        : await Bun.$`npx convex run migrations:getIdMappings ${arg}`.quiet().nothrow();

    if (result.exitCode !== 0) {
        console.error('Failed to fetch ID mappings:', result.stderr.toString());
        throw new Error('Failed to fetch ID mappings');
    }

    try {
        const payload = parseConvexRunJson(result.stdout.toString().trim());
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
            throw new Error(`Unexpected mappings payload: ${String(payload)}`);
        }
        return payload as IdMapping;
    } catch (e) {
        console.error('Failed to parse ID mappings:', result.stdout.toString());
        throw e;
    }
}

/**
 * Import a table into Convex
 */
async function importTable(convexTable: string, jsonlPath: string): Promise<void> {
    console.log(`  Importing ${convexTable}...`);

    const result = useProd
        ? await Bun.$`npx convex import --prod --table ${convexTable} --append ${jsonlPath}`
              .quiet()
              .nothrow()
        : await Bun.$`npx convex import --table ${convexTable} --append ${jsonlPath}`
              .quiet()
              .nothrow();

    if (result.exitCode !== 0) {
        console.error(`Failed to import ${convexTable}:`, result.stderr.toString());
        throw new Error(`Failed to import ${convexTable}`);
    }

    console.log(`  ✓ ${convexTable} imported`);
}

/**
 * Main migration function
 */
async function migrate(sqlDumpPath: string): Promise<void> {
    console.log('='.repeat(60));
    console.log(`MySQL to Convex Migration ${useProd ? '(PRODUCTION)' : '(development)'}`);
    console.log('='.repeat(60));

    // Read and parse SQL dump
    // Use latin1 encoding to preserve raw byte values in binary fields
    console.log(`\nReading SQL dump: ${sqlDumpPath}`);
    const sqlContent = await readFile(sqlDumpPath, 'latin1');

    console.log('Parsing SQL dump...');
    const parsedTables = parseSqlDump(sqlContent);

    console.log(`\nFound tables:`);
    for (const [name, table] of parsedTables) {
        console.log(`  - ${name}: ${table.rows.length} rows`);
    }

    const imagesTable = parsedTables.get('images');
    let imageStorageMapping: ImageStorageMapping = {};
    if (imagesTable && imagesTable.rows.length > 0) {
        console.log('\nUploading referenced image files to Convex storage...');
        imageStorageMapping = await uploadImagesFromDump(imagesTable, sqlDumpPath);
    }

    // Create output directory
    await mkdir(OUTPUT_DIR, {recursive: true});

    // Process each phase
    let idMappings: IdMapping = {};

    for (const phase of IMPORT_PHASES) {
        console.log(`\n${'─'.repeat(60)}`);
        console.log(`Phase ${phase.phase}: ${phase.description}`);
        console.log('─'.repeat(60));

        // If this is not phase 1, fetch ID mappings first
        if (phase.phase > 1) {
            const previousTables = IMPORT_PHASES.slice(0, phase.phase - 1).flatMap(p => p.tables);
            idMappings = await fetchIdMappings(previousTables);
        }

        for (const mysqlTable of phase.tables) {
            const parsed = parsedTables.get(mysqlTable);
            if (!parsed) {
                console.log(`  Skipping ${mysqlTable}: not found in dump`);
                continue;
            }

            if (mysqlTable === 'object_users') {
                const visitedChunks = transformVisitedChunksFromObjectUsers(parsed, idMappings);
                if (visitedChunks.records.length > 0) {
                    const visitedJsonlPath = join(OUTPUT_DIR, `${visitedChunks.convexTable}.jsonl`);
                    const visitedJsonlContent = toJsonl(visitedChunks.records);
                    await writeFile(visitedJsonlPath, visitedJsonlContent);

                    console.log(
                        `  Generated ${visitedChunks.convexTable}.jsonl (${visitedChunks.records.length} records)`,
                    );

                    await importTable(visitedChunks.convexTable, visitedJsonlPath);
                } else {
                    console.log(`  Skipping userVisitedChunks: no records to import`);
                }
                continue;
            }

            // Transform the data
            const transformed = transformTable(
                parsed,
                idMappings,
                parsedTables,
                imageStorageMapping,
            );
            if (!transformed) {
                console.log(`  Skipping ${mysqlTable}: no transform config`);
                continue;
            }

            if (transformed.records.length === 0) {
                console.log(`  Skipping ${transformed.convexTable}: no records to import`);
                continue;
            }

            // Write JSONL file
            const jsonlPath = join(OUTPUT_DIR, `${transformed.convexTable}.jsonl`);
            const jsonlContent = toJsonl(transformed.records);
            await writeFile(jsonlPath, jsonlContent);

            console.log(
                `  Generated ${transformed.convexTable}.jsonl (${transformed.records.length} records)`,
            );

            // Import into Convex
            await importTable(transformed.convexTable, jsonlPath);

            if (mysqlTable === 'objects') {
                const markerMappings = await fetchIdMappings([
                    ...IMPORT_PHASES.slice(0, phase.phase).flatMap(p => p.tables),
                    'objects',
                ]);
                const markers = transformMarkersFromObjects(parsedTables, markerMappings);
                if (markers.records.length > 0) {
                    const markersJsonlPath = join(OUTPUT_DIR, `${markers.convexTable}.jsonl`);
                    const markersJsonlContent = toJsonl(markers.records);
                    await writeFile(markersJsonlPath, markersJsonlContent);

                    console.log(
                        `  Generated ${markers.convexTable}.jsonl (${markers.records.length} records)`,
                    );

                    await importTable(markers.convexTable, markersJsonlPath);
                } else {
                    console.log(`  Skipping markers: no records to import`);
                }
            }
        }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('Migration complete!');
    console.log('='.repeat(60));
}

function parseArgs(argv: string[]): {
    sqlDumpPath: string;
    useProd: boolean;
    uploadsHost: string | null;
    uploadsInsecure: boolean;
} {
    const args = [...argv];
    let useProdFlag = false;
    let uploadsHostFlag: string | null = process.env.MIGRATION_UPLOADS_HOST ?? null;
    let uploadsInsecureFlag = parseBoolEnv(process.env.MIGRATION_UPLOADS_INSECURE);

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--prod') {
            useProdFlag = true;
            args.splice(i, 1);
            i--;
            continue;
        }

        if (arg.startsWith('--uploads-host=')) {
            const value = arg.slice('--uploads-host='.length).trim();
            if (!value) {
                throw new Error('Missing value for --uploads-host');
            }
            uploadsHostFlag = value;
            args.splice(i, 1);
            i--;
            continue;
        }

        if (arg === '--uploads-host') {
            const value = args[i + 1]?.trim();
            if (!value) {
                throw new Error('Missing value for --uploads-host');
            }
            uploadsHostFlag = value;
            args.splice(i, 2);
            i--;
            continue;
        }

        if (arg === '--uploads-insecure') {
            uploadsInsecureFlag = true;
            args.splice(i, 1);
            i--;
        }
    }

    if (args.length === 0) {
        throw new Error(
            'Usage: bun run scripts/mysql-to-convex/migrate.ts <path-to-sql-dump> [--prod] [--uploads-host <url>] [--uploads-insecure]',
        );
    }

    return {
        sqlDumpPath: args[0],
        useProd: useProdFlag,
        uploadsHost: uploadsHostFlag ? normalizeUploadsHost(uploadsHostFlag) : null,
        uploadsInsecure: uploadsInsecureFlag,
    };
}

// Main entry point
let sqlDumpPath = '';
try {
    const parsed = parseArgs(process.argv.slice(2));
    sqlDumpPath = parsed.sqlDumpPath;
    useProd = parsed.useProd;
    uploadsHost = parsed.uploadsHost;
    uploadsInsecure = parsed.uploadsInsecure;
} catch (error) {
    console.error(String(error));
    process.exit(1);
}

console.log(`Target: ${useProd ? 'PRODUCTION' : 'development'}`);
if (uploadsHost) {
    console.log(`Uploads host: ${uploadsHost}`);
}
if (uploadsInsecure) {
    console.log('Uploads TLS verification: disabled (--uploads-insecure)');
}

migrate(sqlDumpPath).catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
});
