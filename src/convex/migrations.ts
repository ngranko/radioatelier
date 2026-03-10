import {v} from 'convex/values';
import {mutation, query} from './_generated/server';

/**
 * Get ID mappings (mysqlId -> convexId) for specified tables
 * Used by the migration script to resolve foreign keys
 */
export const getIdMappings = query({
    args: {tables: v.array(v.string())},
    handler: async (ctx, {tables}) => {
        const mappings: Record<string, Record<string, string>> = {};

        for (const table of tables) {
            mappings[table] = {};

            // We need to handle each table separately due to type constraints
            let records: Array<{_id: string; mysqlId?: string}> = [];

            switch (table) {
                case 'users':
                    records = await ctx.db.query('users').collect();
                    break;
                case 'categories':
                    records = await ctx.db.query('categories').collect();
                    break;
                case 'tags':
                    records = await ctx.db.query('tags').collect();
                    break;
                case 'images':
                    records = await ctx.db.query('images').collect();
                    break;
                case 'mapPoints':
                    records = await ctx.db.query('mapPoints').collect();
                    break;
                case 'privateTags':
                    records = await ctx.db.query('privateTags').collect();
                    break;
                case 'objects':
                    records = await ctx.db.query('objects').collect();
                    break;
                default:
                    console.warn(`Unknown table: ${table}`);
                    continue;
            }

            for (const record of records) {
                if (record.mysqlId) {
                    mappings[table][record.mysqlId] = record._id;
                }
            }
        }

        return mappings;
    },
});

/**
 * Generate a Convex Storage upload URL for one-off migration script usage.
 */
export const generateMigrationUploadUrl = mutation({
    args: {},
    handler: async ctx => {
        return await ctx.storage.generateUploadUrl();
    },
});
