import {getNotionApiKey} from './config';
import type {NotionDataSource, NotionPage} from './types';

const NOTION_API_BASE = 'https://api.notion.com/v1';
const NOTION_API_VERSION = '2026-03-11';
const MAX_RETRY_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 15_000;
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

type QueryResponse = {
    results: NotionPage[];
    has_more: boolean;
    next_cursor: string | null;
};

export class NotionRequestError extends Error {
    constructor(
        message: string,
        readonly status: number,
        readonly retryable: boolean,
    ) {
        super(message);
        this.name = 'NotionRequestError';
    }
}

export async function retrieveDataSource(dataSourceId: string) {
    return await notionRequest<NotionDataSource>(`/data_sources/${dataSourceId}`, {
        method: 'GET',
    });
}

export async function queryAllDataSourcePages(dataSourceId: string) {
    const pages: NotionPage[] = [];
    let cursor: string | null = null;

    do {
        const response: QueryResponse = await notionRequest<QueryResponse>(
            `/data_sources/${dataSourceId}/query`,
            {
                method: 'POST',
                body: JSON.stringify(cursor ? {start_cursor: cursor} : {}),
            },
        );
        pages.push(...response.results);
        cursor = response.has_more ? response.next_cursor : null;
    } while (cursor);

    return pages;
}

export async function retrievePage(pageId: string) {
    return await notionRequest<NotionPage>(`/pages/${pageId}`, {
        method: 'GET',
    });
}

export async function createPage(dataSourceId: string, properties: Record<string, unknown>) {
    return await notionRequest<NotionPage>('/pages', {
        method: 'POST',
        body: JSON.stringify({
            parent: {
                type: 'data_source_id',
                data_source_id: dataSourceId,
            },
            properties,
        }),
    });
}

export async function updatePage(pageId: string, properties: Record<string, unknown>) {
    return await notionRequest<NotionPage>(`/pages/${pageId}`, {
        method: 'PATCH',
        body: JSON.stringify({properties}),
    });
}

export async function archivePage(pageId: string) {
    return await notionRequest<NotionPage>(`/pages/${pageId}`, {
        method: 'PATCH',
        body: JSON.stringify({in_trash: true}),
    });
}

async function notionRequest<T>(
    path: string,
    init: Omit<RequestInit, 'headers'> & {headers?: Record<string, string>},
) {
    for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        let response: Response;
        try {
            response = await fetch(`${NOTION_API_BASE}${path}`, {
                ...init,
                signal: controller.signal,
                headers: {
                    Authorization: `Bearer ${getNotionApiKey()}`,
                    'Content-Type': 'application/json',
                    'Notion-Version': NOTION_API_VERSION,
                    ...init.headers,
                },
            });
        } catch (error) {
            if (attempt < MAX_RETRY_ATTEMPTS) {
                await sleep(getRetryDelayMs(undefined, attempt));
                continue;
            }

            const timedOut = isAbortError(error);
            const message = timedOut
                ? 'Notion request timed out'
                : error instanceof Error
                  ? `Notion request failed: ${error.message}`
                  : 'Notion request failed';
            throw new NotionRequestError(message, timedOut ? 408 : 0, true);
        } finally {
            clearTimeout(timeoutId);
        }

        if (response.ok) {
            return (await response.json()) as T;
        }

        const retryable = RETRYABLE_STATUS_CODES.has(response.status);
        if (retryable && attempt < MAX_RETRY_ATTEMPTS) {
            await sleep(getRetryDelayMs(response, attempt));
            continue;
        }

        const message = await response.text();
        throw new NotionRequestError(
            `Notion request failed (${response.status}): ${message}`,
            response.status,
            retryable,
        );
    }

    throw new NotionRequestError('Notion request failed after retries', 0, true);
}

function isAbortError(error: unknown) {
    return (
        (error instanceof DOMException && error.name === 'AbortError') ||
        (error instanceof Error && error.name === 'AbortError')
    );
}

function getRetryDelayMs(response: Response | undefined, attempt: number) {
    const retryAfter = response?.headers.get('retry-after');
    if (retryAfter) {
        const seconds = Number.parseFloat(retryAfter);
        if (Number.isFinite(seconds)) {
            return Math.max(0, seconds * 1000);
        }
    }

    return Math.min(8000, 500 * 2 ** attempt);
}

function sleep(durationMs: number) {
    return new Promise(resolve => setTimeout(resolve, durationMs));
}
