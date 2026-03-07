import {ConvexError, v} from 'convex/values';
import type {ImportJobStatus, ImportLineFeedback} from '../lib/interfaces/importShared';
import {internalMutation, mutation, query} from './_generated/server';
import {ensureCategory, ensurePrivateTags, ensureTags} from './helpers/importHelpers';
import {getNextInternalId, updateIsVisited} from './helpers/objectHelpers';
import {getCurrentUserOrThrow} from './users';

const importMappingsValidator = {
    coordinates: v.number(),
    name: v.number(),
    category: v.number(),
    isVisited: v.nullable(v.number()),
    isPublic: v.nullable(v.number()),
    isRemoved: v.nullable(v.number()),
    tags: v.nullable(v.number()),
    privateTags: v.nullable(v.number()),
    address: v.nullable(v.number()),
    city: v.nullable(v.number()),
    country: v.nullable(v.number()),
    installedPeriod: v.nullable(v.number()),
    removalPeriod: v.nullable(v.number()),
    description: v.nullable(v.number()),
    source: v.nullable(v.number()),
    image: v.nullable(v.number()),
};

const importRowValidator = {
    line: v.number(),
    coordinates: v.string(),
    name: v.string(),
    category: v.string(),
    isVisited: v.boolean(),
    isPublic: v.boolean(),
    isRemoved: v.boolean(),
    tags: v.array(v.string()),
    privateTags: v.array(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    installedPeriod: v.optional(v.string()),
    removalPeriod: v.optional(v.string()),
    description: v.optional(v.string()),
    source: v.optional(v.string()),
    imageSource: v.optional(v.string()),
    imageId: v.optional(v.id('images')),
};

const FEEDBACK_LIMIT = 300;
const JOB_RETENTION_MS = 1000 * 60 * 60 * 24 * 7;

const LIMITS = {
    name: 256,
    category: 128,
    tag: 128,
    address: 256,
    city: 128,
    country: 128,
    period: 64,
    description: 8000,
    source: 2048,
} as const;

function trimToLimit(value: string, maxLength: number) {
    return value.trim().slice(0, maxLength);
}

function toNullableString(value: string | undefined) {
    const normalized = value?.trim();
    return normalized || null;
}

function normalizeTagList(values: string[]) {
    return values.map(item => trimToLimit(item.toLowerCase(), LIMITS.tag)).filter(Boolean);
}

function parseCoordinates(rawCoordinates: string) {
    const [latitudeRaw = '', longitudeRaw = ''] = rawCoordinates.split(',');
    const latitude = Number.parseFloat(latitudeRaw.trim());
    const longitude = Number.parseFloat(longitudeRaw.trim());

    if (!Number.isFinite(latitude) || Math.abs(latitude) > 90) {
        return null;
    }
    if (!Number.isFinite(longitude) || Math.abs(longitude) > 180) {
        return null;
    }

    return {latitude, longitude};
}

function trimFeedback(feedback: ImportLineFeedback[]) {
    if (feedback.length <= FEEDBACK_LIMIT) {
        return feedback;
    }
    return feedback.slice(0, FEEDBACK_LIMIT);
}

function appendFeedback(existing: ImportLineFeedback[], extra: ImportLineFeedback[]) {
    if (extra.length === 0) {
        return existing;
    }
    return trimFeedback([...existing, ...extra]);
}

function isValidUrl(value: string | null) {
    if (!value) {
        return false;
    }
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

function toJobStatus(status: string): ImportJobStatus {
    if (status === 'success' || status === 'error' || status === 'cancelled') {
        return status;
    }
    return 'running';
}

export const startJob = mutation({
    args: {
        totalRows: v.number(),
        mappings: v.object(importMappingsValidator),
    },
    handler: async (ctx, {totalRows}) => {
        const user = await getCurrentUserOrThrow(ctx);
        return await ctx.db.insert('importJobs', {
            createdById: user._id,
            status: 'running',
            totalRows,
            processedRows: 0,
            successfulRows: 0,
            percentage: 0,
            startedAt: Date.now(),
            feedback: [],
            lastBatchSequence: 0,
        });
    },
});

export const getJob = query({
    args: {
        jobId: v.id('importJobs'),
    },
    handler: async (ctx, {jobId}) => {
        const user = await getCurrentUserOrThrow(ctx);
        const job = await ctx.db.get(jobId);
        if (!job || job.createdById !== user._id) {
            return null;
        }
        return job;
    },
});

export const cancelJob = mutation({
    args: {
        jobId: v.id('importJobs'),
    },
    handler: async (ctx, {jobId}) => {
        const user = await getCurrentUserOrThrow(ctx);
        const job = await ctx.db.get(jobId);
        if (!job || job.createdById !== user._id) {
            throw new ConvexError('Import job not found');
        }
        if (job.status !== 'running') {
            return;
        }
        await ctx.db.patch(jobId, {
            status: 'cancelled',
            finishedAt: Date.now(),
        });
        return;
    },
});

export const importBatch = mutation({
    args: {
        jobId: v.id('importJobs'),
        sequence: v.number(),
        rows: v.array(v.object(importRowValidator)),
    },
    handler: async (ctx, {jobId, sequence, rows}) => {
        const user = await getCurrentUserOrThrow(ctx);
        const job = await ctx.db.get(jobId);
        if (!job || job.createdById !== user._id) {
            throw new ConvexError('Import job not found');
        }

        if (job.status !== 'running' || (job.lastBatchSequence ?? 0) >= sequence) {
            return {
                processedRows: job.processedRows,
                successfulRows: job.successfulRows,
                percentage: job.percentage,
                status: toJobStatus(job.status),
            };
        }

        let processedRows = job.processedRows;
        let successfulRows = job.successfulRows;
        let feedback: ImportLineFeedback[] = [...job.feedback];

        for (const row of rows) {
            const rowFeedback: ImportLineFeedback[] = [];
            const coordinates = parseCoordinates(row.coordinates);
            if (!coordinates) {
                processedRows += 1;
                feedback = appendFeedback(feedback, [
                    {
                        line: row.line,
                        text: 'Неверные координаты',
                        severity: 'error',
                    },
                ]);
                continue;
            }

            const objectName = trimToLimit(row.name, LIMITS.name);
            if (!objectName) {
                processedRows += 1;
                feedback = appendFeedback(feedback, [
                    {
                        line: row.line,
                        text: 'Название обязательно',
                        severity: 'error',
                    },
                ]);
                continue;
            }

            const categoryName = trimToLimit(row.category.toLowerCase(), LIMITS.category);
            if (!categoryName) {
                processedRows += 1;
                feedback = appendFeedback(feedback, [
                    {
                        line: row.line,
                        text: 'Категория обязательна',
                        severity: 'error',
                    },
                ]);
                continue;
            }

            try {
                const categoryId = await ensureCategory(ctx, categoryName);
                const tagIds = await ensureTags(ctx, normalizeTagList(row.tags));
                const privateTagIds = await ensurePrivateTags(
                    ctx,
                    normalizeTagList(row.privateTags),
                    user._id,
                );

                const sourceCandidate = toNullableString(row.source);
                const source = sourceCandidate ? trimToLimit(sourceCandidate, LIMITS.source) : null;
                const validatedSource = isValidUrl(source) ? source : null;
                if (source && !validatedSource) {
                    rowFeedback.push({
                        line: row.line,
                        text: 'Некорректная ссылка источника, значение пропущено',
                        severity: 'warning',
                    });
                }

                if (row.imageSource && !row.imageId) {
                    rowFeedback.push({
                        line: row.line,
                        text: 'Не удалось обработать изображение, поле пропущено',
                        severity: 'warning',
                    });
                }

                const mapPointId = await ctx.db.insert('mapPoints', {
                    latitude: coordinates.latitude,
                    longitude: coordinates.longitude,
                    address: trimToLimit(toNullableString(row.address) ?? '', LIMITS.address),
                    city: trimToLimit(toNullableString(row.city) ?? '', LIMITS.city),
                    country: trimToLimit(toNullableString(row.country) ?? '', LIMITS.country),
                });

                const objectId = await ctx.db.insert('objects', {
                    name: objectName,
                    description: trimToLimit(
                        toNullableString(row.description) ?? '',
                        LIMITS.description,
                    ),
                    installedPeriod: trimToLimit(
                        toNullableString(row.installedPeriod) ?? '',
                        LIMITS.period,
                    ),
                    isRemoved: row.isRemoved,
                    removalPeriod: trimToLimit(
                        toNullableString(row.removalPeriod) ?? '',
                        LIMITS.period,
                    ),
                    source: validatedSource,
                    coverId: row.imageId ?? null,
                    categoryId,
                    isPublic: row.isPublic,
                    tagIds,
                    mapPointId,
                    createdById: user._id,
                    internalId: await getNextInternalId(ctx),
                });

                await ctx.db.insert('objectPrivateTags', {
                    objectId,
                    privateTagIds,
                    userId: user._id,
                });

                await ctx.db.insert('markers', {
                    objectId,
                    latitude: coordinates.latitude,
                    longitude: coordinates.longitude,
                    createdById: user._id,
                    categoryId,
                    tagIds,
                    isRemoved: row.isRemoved,
                    isPublic: row.isPublic,
                });

                await updateIsVisited(ctx, objectId, user._id, row.isVisited);

                processedRows += 1;
                successfulRows += 1;
                feedback = appendFeedback(feedback, rowFeedback);
            } catch (error) {
                processedRows += 1;
                feedback = appendFeedback(feedback, [
                    ...rowFeedback,
                    {
                        line: row.line,
                        text:
                            error instanceof Error
                                ? error.message
                                : 'Не удалось импортировать строку',
                        severity: 'error',
                    },
                ]);
            }
        }

        const percentage =
            job.totalRows === 0
                ? 100
                : Math.min(100, Math.round((processedRows / job.totalRows) * 100));

        await ctx.db.patch(jobId, {
            processedRows,
            successfulRows,
            percentage,
            feedback: trimFeedback(feedback),
            lastBatchSequence: sequence,
        });

        return {
            processedRows,
            successfulRows,
            percentage,
            status: 'running' as ImportJobStatus,
        };
    },
});

export const finalizeJob = mutation({
    args: {
        jobId: v.id('importJobs'),
        failed: v.optional(v.boolean()),
        globalError: v.optional(v.string()),
    },
    handler: async (ctx, {jobId, failed, globalError}) => {
        const user = await getCurrentUserOrThrow(ctx);
        const job = await ctx.db.get(jobId);
        if (!job || job.createdById !== user._id) {
            throw new ConvexError('Import job not found');
        }
        if (job.status === 'cancelled') {
            return;
        }
        if (failed) {
            await ctx.db.patch(jobId, {
                status: 'error',
                globalError: globalError ?? 'Импорт завершился с ошибкой',
                finishedAt: Date.now(),
            });
            return;
        }
        await ctx.db.patch(jobId, {
            status: 'success',
            finishedAt: Date.now(),
            percentage: 100,
        });
        return;
    },
});

export const cleanupOldJobs = internalMutation({
    args: {},
    returns: v.null(),
    handler: async ctx => {
        const threshold = Date.now() - JOB_RETENTION_MS;
        const jobs = await ctx.db.query('importJobs').collect();

        for (const job of jobs) {
            const lastRelevantTimestamp = job.finishedAt ?? job.startedAt ?? job._creationTime;
            if (lastRelevantTimestamp < threshold) {
                await ctx.db.delete(job._id);
            }
        }

        return null;
    },
});
