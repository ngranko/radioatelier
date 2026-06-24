import {api} from '$convex/_generated/api';
import type {Id} from '$convex/_generated/dataModel';
import type {
    ImportMappingsForJob,
    ImportProviderPayload,
    NormalizedImportRow,
} from '$lib/interfaces/import';
import {resolveImportImage} from '$lib/services/import/imageResolver';
import type {ConvexClient} from 'convex/browser';

export type ConvexClientLike = ConvexClient;

export type ImportSuccessHandler = (payload: ImportProviderPayload) => void;
export type ImportErrorHandler = (payload: ImportProviderPayload) => void;
export type ImportDisconnectHandler = () => void;
export type ImportProgressHandler = (payload: ImportProviderPayload) => void;

const BATCH_SIZE = 25;

export class ImportProvider {
    private readonly client: ConvexClientLike;
    private successHandler?: ImportSuccessHandler;
    private errorHandler?: ImportErrorHandler;
    private disconnectHandler?: ImportDisconnectHandler;
    private progressHandler?: ImportProgressHandler;
    private isStarted = false;
    private isFinished = false;
    private isCancelled = false;
    private currentJobId?: Id<'importJobs'>;
    private imageIdBySource = new Map<string, Id<'images'>>();

    public constructor(client: ConvexClientLike) {
        this.client = client;
    }

    public isRunning(): boolean {
        return this.isStarted && !this.isFinished;
    }

    public getJobId(): Id<'importJobs'> | undefined {
        return this.currentJobId;
    }

    public setErrorHandler(handler: ImportErrorHandler) {
        this.errorHandler = handler;
    }

    public setDisconnectHandler(handler: ImportDisconnectHandler) {
        this.disconnectHandler = handler;
    }

    public setSuccessHandler(handler: ImportSuccessHandler) {
        this.successHandler = handler;
    }

    public setProgressHandler(handler: ImportProgressHandler) {
        this.progressHandler = handler;
    }

    public async start(
        rows: NormalizedImportRow[],
        mappings: ImportMappingsForJob,
    ): Promise<Id<'importJobs'>> {
        this.isStarted = true;
        this.isFinished = false;
        this.isCancelled = false;
        const jobId = await this.client.mutation(api.imports.startJob, {
            totalRows: rows.length,
            mappings,
        });
        this.currentJobId = jobId;

        void this.runImport(jobId, rows);
        return jobId;
    }

    public cancel() {
        this.isCancelled = true;
        this.isFinished = true;
        if (this.currentJobId) {
            this.client
                .mutation(api.imports.cancelJob, {jobId: this.currentJobId})
                .catch(error => {
                    console.error('Failed to cancel import job', error);
                })
                .finally(() => {
                    if (this.disconnectHandler) {
                        this.disconnectHandler();
                    }
                });
            return;
        }
        if (this.disconnectHandler) {
            this.disconnectHandler();
        }
    }

    private async runImport(jobId: Id<'importJobs'>, rows: NormalizedImportRow[]) {
        try {
            let latestProgress: ImportProviderPayload = {
                total: rows.length,
                successful: 0,
                percentage: 0,
                processed: 0,
            };
            if (this.progressHandler) {
                this.progressHandler(latestProgress);
            }

            let sequence = 1;
            for (let i = 0; i < rows.length; i += BATCH_SIZE) {
                if (this.isCancelled) {
                    break;
                }
                const batch = rows.slice(i, i + BATCH_SIZE);
                const preparedBatch = await Promise.all(
                    batch.map(async row => {
                        const imageId = await resolveImportImage(
                            this.client,
                            row.imageSource,
                            this.imageIdBySource,
                        );
                        return {
                            ...row,
                            ...(imageId ? {imageId} : {}),
                        };
                    }),
                );

                const result = await this.client.mutation(api.imports.importBatch, {
                    jobId,
                    sequence,
                    rows: preparedBatch,
                });
                sequence += 1;

                latestProgress = {
                    total: rows.length,
                    successful: result.successfulRows,
                    percentage: result.percentage,
                    processed: result.processedRows,
                };
                if (this.progressHandler) {
                    this.progressHandler(latestProgress);
                }
            }

            if (this.isCancelled) {
                this.isFinished = true;
                return;
            }

            if (rows.length === 0 || latestProgress.processed < rows.length) {
                await this.client.mutation(api.imports.finalizeJob, {jobId});
            }
            this.isFinished = true;
            if (this.successHandler) {
                this.successHandler({...latestProgress, percentage: 100});
            }
        } catch (error) {
            this.isFinished = true;
            await this.client
                .mutation(api.imports.finalizeJob, {
                    jobId,
                    failed: true,
                    globalError:
                        error instanceof Error ? error.message : 'Импорт завершился с ошибкой',
                })
                .catch(console.error);

            if (this.errorHandler) {
                this.errorHandler({
                    total: rows.length,
                    successful: 0,
                    percentage: 0,
                    processed: 0,
                    error: error instanceof Error ? error.message : 'Импорт завершился с ошибкой',
                });
            }
        }
    }
}
