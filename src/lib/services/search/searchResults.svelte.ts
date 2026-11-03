import type {
    MapPlaceable,
    SearchItem,
    SearchPageSource,
    SearchResultsPage,
} from '$lib/interfaces/object';

export type SearchSource = 'local' | 'google';
export type SearchRequest = MapPlaceable & {query: string};
export type SearchSources = Record<SearchSource, SearchPageSource>;

export interface SearchResultsMap {
    clear(): void;
    publishPins(items: SearchItem[]): void;
    fit(items: SearchItem[], center: MapPlaceable): void;
    rememberArea(): void;
}

export interface SearchResultsListState {
    items: SearchItem[];
    hasMore: boolean;
    hasLoaded: boolean;
    isLoading: boolean;
    isLoadingMore: boolean;
    isError: boolean;
    isAppendError: boolean;
}

function createPage() {
    return {
        items: [] as SearchItem[],
        nextCursor: '',
        hasMore: false,
        hasLoaded: false,
        isLoading: false,
        isLoadingMore: false,
        isError: false,
        isAppendError: false,
    };
}

type ResultsPage = ReturnType<typeof createPage>;
type CreateSources = (request: SearchRequest) => SearchSources;

export function createSearchResults(createSources: CreateSources, map: SearchResultsMap) {
    return new SearchResults(createSources, map);
}

class SearchResults {
    #pages = $state({local: createPage(), google: createPage()});
    #activeSource = $state<SearchSource>('local');
    #request: SearchRequest | null = null;
    #sources: SearchSources | null = null;
    #disposed = false;

    constructor(
        private createSources: CreateSources,
        private map: SearchResultsMap,
    ) {}

    get activeSource() {
        return this.#activeSource;
    }

    get pages(): Readonly<Record<SearchSource, Readonly<SearchResultsListState>>> {
        return this.#pages;
    }

    startSearch(request: SearchRequest) {
        if (this.#disposed) {
            return Promise.resolve();
        }
        if (this.#request?.query !== request.query) {
            this.#activeSource = 'local';
        }
        this.#request = {...request};
        this.#sources = this.createSources(this.#request);
        this.#pages = {local: createPage(), google: createPage()};
        this.map.clear();
        return this.#loadPage(this.#activeSource, false);
    }

    activateSource(source: SearchSource) {
        if (this.#disposed || !this.#request || source === this.#activeSource) {
            return Promise.resolve();
        }
        this.#activeSource = source;
        const page = this.#pages[source];
        if (page.hasLoaded) {
            this.#publish(page.items, this.#request);
            return Promise.resolve();
        }
        this.map.clear();
        return this.#loadPage(source, false);
    }

    loadMore() {
        const page = this.#pages[this.#activeSource];
        if (this.#disposed || !page.hasLoaded || !page.hasMore) {
            return Promise.resolve();
        }
        return this.#loadPage(this.#activeSource, true);
    }

    dispose() {
        this.#disposed = true;
    }

    async #loadPage(source: SearchSource, append: boolean): Promise<void> {
        const page = this.#pages[source];
        if (page.isLoading || page.isLoadingMore) {
            return Promise.resolve();
        }
        const request = this.#request!;
        const load = this.#sources![source];
        page.isLoading = !append;
        page.isLoadingMore = append;
        page.isError = page.isAppendError = false;
        try {
            const result = await load(append ? page.nextCursor : '');
            this.#acceptPage(source, page, request, result, append);
        } catch (error) {
            this.#rejectPage(source, page, error, append);
        } finally {
            if (this.#isCurrent(source, page)) {
                page.isLoading = page.isLoadingMore = false;
            }
        }
    }

    #acceptPage(
        source: SearchSource,
        page: ResultsPage,
        request: SearchRequest,
        result: SearchResultsPage,
        append: boolean,
    ) {
        if (!this.#isCurrent(source, page)) {
            return;
        }
        page.items = append ? [...page.items, ...result.items] : result.items;
        page.nextCursor = result.nextCursor;
        page.hasMore = result.hasMore;
        page.hasLoaded = true;
        if (source === this.#activeSource) {
            this.#publish(page.items, request);
        }
    }

    #rejectPage(source: SearchSource, page: ResultsPage, error: unknown, append: boolean) {
        if (!this.#isCurrent(source, page)) {
            return;
        }
        if (append) {
            page.isAppendError = true;
        } else {
            page.isError = true;
        }
        console.error(`${source} search failed`, error);
    }

    #isCurrent(source: SearchSource, page: ResultsPage) {
        return !this.#disposed && this.#pages[source] === page;
    }

    #publish(items: SearchItem[], request: SearchRequest) {
        this.map.publishPins(items);
        this.map.fit(items, request);
        this.map.rememberArea();
    }
}
