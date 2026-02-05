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
 */

import {mkdir, writeFile, readFile} from 'node:fs/promises';
import {join, dirname} from 'node:path';
import {parseSqlDump} from './parse-sql';
import {transformTable, toJsonl, getTransformConfig, type IdMapping} from './transform';

const OUTPUT_DIR = join(dirname(new URL(import.meta.url).pathname), 'output');

// Will be set based on --prod flag
let useProd = false;

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
        tables: ['object_tags', 'object_private_tags', 'object_users'],
        description: 'Junction tables',
    },
];

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
        // Parse the output - convex run outputs JSON
        const output = result.stdout.toString().trim();
        // Find the JSON object in the output (skip any logging lines)
        const jsonMatch = output.match(/\{[\s\S]*\}$/);
        if (!jsonMatch) {
            throw new Error(`Could not parse JSON from output: ${output}`);
        }
        return JSON.parse(jsonMatch[0]);
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

            // Transform the data
            const transformed = transformTable(parsed, idMappings);
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
        }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('Migration complete!');
    console.log('='.repeat(60));
}

// Main entry point
const args = process.argv.slice(2);
const prodFlagIndex = args.indexOf('--prod');
if (prodFlagIndex !== -1) {
    useProd = true;
    args.splice(prodFlagIndex, 1);
}

if (args.length === 0) {
    console.error('Usage: bun run scripts/mysql-to-convex/migrate.ts <path-to-sql-dump> [--prod]');
    process.exit(1);
}

console.log(`Target: ${useProd ? 'PRODUCTION' : 'development'}`);

migrate(args[0]).catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
});
