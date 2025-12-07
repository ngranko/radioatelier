import {browser} from '$app/environment';
import {listCategories} from '$lib/api/category.ts';
import {listPrivateTags} from '$lib/api/privateTag.ts';
import {listTags} from '$lib/api/tag.ts';
import type {Category} from '$lib/interfaces/category.ts';
import type {Tag} from '$lib/interfaces/tag.ts';

type FetchFn = typeof fetch;

interface CachedData {
    categories: Category[];
    tags: Tag[];
    privateTags: Tag[];
}

// TODO: comb through this
let cachedPromise: Promise<CachedData> | null = null;
export async function getReferenceData(fetch: FetchFn): Promise<CachedData> {
    if (browser && cachedPromise) {
        return cachedPromise;
    }

    const promise = fetchReferenceData(fetch);

    if (browser) {
        cachedPromise = promise;
    }

    try {
        return await promise;
    } catch (error) {
        if (browser) {
            cachedPromise = null;
        }
        throw error;
    }
}

async function fetchReferenceData(fetch: FetchFn): Promise<CachedData> {
    const [categoriesResult, tagsResult, privateTagsResult] = await Promise.all([
        listCategories({fetch}).catch(error => {
            console.error('Failed to fetch categories:', error);
            return {data: {categories: [] as Category[]}};
        }),
        listTags({fetch}).catch(error => {
            console.error('Failed to fetch tags:', error);
            return {data: {tags: [] as Tag[]}};
        }),
        listPrivateTags({fetch}).catch(error => {
            console.error('Failed to fetch private tags:', error);
            return {data: {tags: [] as Tag[]}};
        }),
    ]);

    return {
        categories: categoriesResult.data.categories,
        tags: tagsResult.data.tags,
        privateTags: privateTagsResult.data.tags,
    };
}

export function invalidateReferenceData(): void {
    cachedPromise = null;
}
