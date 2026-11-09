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
    private sourcePages = $state({local: createPage(), google: createPage()});
    private currentSource = $state<SearchSource>('local');
    private request: SearchRequest | null = null;
    private sources: SearchSources | null = null;
    private isDisposed = false;

    public constructor(
        private createSources: CreateSources,
        private map: SearchResultsMap,
    ) {}

    public get activeSource() {
        return this.currentSource;
    }

    public get pages(): Readonly<Record<SearchSource, Readonly<SearchResultsListState>>> {
        return this.sourcePages;
    }

    public startSearch(request: SearchRequest) {
        if (this.isDisposed) {
            return Promise.resolve();
        }
        if (this.request?.query !== request.query) {
            this.currentSource = 'local';
        }
        this.request = {...request};
        this.sources = this.createSources(this.request);
        this.sourcePages = {local: createPage(), google: createPage()};
        this.map.clear();
        return this.loadPage(this.currentSource, false);
    }

    public activateSource(source: SearchSource) {
        if (this.isDisposed || !this.request || source === this.currentSource) {
            return Promise.resolve();
        }
        this.currentSource = source;
        const page = this.sourcePages[source];
        if (page.hasLoaded) {
            this.publish(page.items, this.request);
            return Promise.resolve();
        }
        this.map.clear();
        return this.loadPage(source, false);
    }

    public loadMore() {
        const page = this.sourcePages[this.currentSource];
        if (this.isDisposed || !page.hasLoaded || !page.hasMore) {
            return Promise.resolve();
        }
        return this.loadPage(this.currentSource, true);
    }

    public dispose() {
        this.isDisposed = true;
    }

    private async loadPage(source: SearchSource, append: boolean): Promise<void> {
        const page = this.sourcePages[source];
        if (page.isLoading || page.isLoadingMore) {
            return Promise.resolve();
        }
        const request = this.request!;
        const load = this.sources![source];
        page.isLoading = !append;
        page.isLoadingMore = append;
        page.isError = false;
        page.isAppendError = false;
        try {
            const result = await load(append ? page.nextCursor : '');
            this.acceptPage(source, page, request, result, append);
        } catch (error) {
            this.rejectPage(source, page, error, append);
        } finally {
            if (this.isCurrent(source, page)) {
                page.isLoading = false;
                page.isLoadingMore = false;
            }
        }
    }

    private acceptPage(
        source: SearchSource,
        page: ResultsPage,
        request: SearchRequest,
        result: SearchResultsPage,
        append: boolean,
    ) {
        if (!this.isCurrent(source, page)) {
            return;
        }
        page.items = append ? [...page.items, ...result.items] : result.items;
        page.nextCursor = result.nextCursor;
        page.hasMore = result.hasMore;
        page.hasLoaded = true;
        if (source === this.currentSource) {
            this.publish(page.items, request);
        }
    }

    private rejectPage(source: SearchSource, page: ResultsPage, error: unknown, append: boolean) {
        if (!this.isCurrent(source, page)) {
            return;
        }
        page.isAppendError = append;
        page.isError = !append;
        console.error(`${source} search failed`, error);
    }

    private isCurrent(source: SearchSource, page: ResultsPage) {
        return !this.isDisposed && this.sourcePages[source] === page;
    }

    private publish(items: SearchItem[], request: SearchRequest) {
        this.map.publishPins(items);
        this.map.fit(items, request);
        this.map.rememberArea();
    }
}
