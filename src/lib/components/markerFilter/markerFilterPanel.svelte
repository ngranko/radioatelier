<script lang="ts">
    import ClearButton from '$lib/components/search/clearButton.svelte';
    import {Button} from '$lib/components/ui/button';
    import {
        markerFilterState,
        closeMarkerFilter,
        clearMarkerFilter,
        selectedFilterCount,
        isFilterSelected,
        type FilterKind,
        type FilterOption,
        type TrayItem,
    } from '$lib/state/markerFilter.svelte';
    import {registerEscapeCloseHandler} from '$lib/utils/escapeClose';
    import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
    import LockIcon from '@lucide/svelte/icons/lock';
    import MapPinIcon from '@lucide/svelte/icons/map-pin';
    import TagIcon from '@lucide/svelte/icons/tag';
    import {onMount, tick} from 'svelte';
    import {cubicOut} from 'svelte/easing';
    import {fly} from 'svelte/transition';
    import MarkerFilterSection from './markerFilterSection.svelte';
    import MarkerFilterTray from './markerFilterTray.svelte';

    interface Props {
        categories: FilterOption[];
        tags: FilterOption[];
        privateTags: FilterOption[];
        // live counts — wire to the real marker totals later
        total: number;
        shown: number;
    }

    let {categories, tags, privateTags, total, shown}: Props = $props();

    let input = $state<HTMLInputElement>();

    const query = $derived(markerFilterState.query.trim().toLowerCase());
    const count = $derived(selectedFilterCount());
    const matches = (option: FilterOption) => option.name.toLowerCase().includes(query);
    const noMatches = $derived(
        query.length > 0 &&
            !categories.some(matches) &&
            !tags.some(matches) &&
            !privateTags.some(matches),
    );

    const trayItems = $derived.by<TrayItem[]>(() => [
        ...pickSelected('categories', categories),
        ...pickSelected('tags', tags),
        ...pickSelected('privateTags', privateTags),
    ]);

    function pickSelected(kind: FilterKind, options: FilterOption[]): TrayItem[] {
        return options
            .filter(option => isFilterSelected(kind, option.id))
            .map(option => ({kind, id: option.id, name: option.name}));
    }

    onMount(() =>
        registerEscapeCloseHandler({
            priority: 20,
            isActive: () => markerFilterState.isOpen,
            close: closeMarkerFilter,
        }),
    );

    $effect(() => {
        if (markerFilterState.isOpen) {
            tick().then(() => input?.focus());
        }
    });
</script>

{#if markerFilterState.isOpen}
    <aside
        aria-label="Фильтр маркеров"
        class="bg-background surface-edge fixed top-0 left-0 z-30 m-2 flex max-h-[calc(100dvh-16px)] w-[calc(100vw-16px)] max-w-sm flex-col overflow-hidden rounded-2xl"
        in:fly={{y: -6, duration: 200, easing: cubicOut}}
        out:fly={{y: -6, duration: 150, easing: cubicOut}}
    >
        <div class="flex items-center gap-1 border-b p-1.5">
            <Button
                variant="ghost"
                size="icon"
                onclick={closeMarkerFilter}
                aria-label="Закрыть фильтр"
                class="text-muted-foreground hover:text-foreground h-8 w-8 rounded-full"
            >
                <ChevronLeftIcon />
            </Button>
            <input
                bind:this={input}
                bind:value={markerFilterState.query}
                placeholder="Категория или тег..."
                autocomplete="off"
                autocorrect="off"
                spellcheck="false"
                class="placeholder:text-muted-foreground/60 h-8 min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            {#if markerFilterState.query}
                <ClearButton onClick={() => (markerFilterState.query = '')} />
            {/if}
        </div>

        <MarkerFilterTray items={trayItems} />

        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {#if noMatches}
                <p class="text-muted-foreground px-4 py-8 text-center text-sm">Ничего не найдено</p>
            {:else}
                <MarkerFilterSection
                    kind="categories"
                    label="Категории"
                    icon={MapPinIcon}
                    options={categories}
                />
                <MarkerFilterSection kind="tags" label="Теги" icon={TagIcon} options={tags} />
                <MarkerFilterSection
                    kind="privateTags"
                    label="Приватные теги"
                    icon={LockIcon}
                    options={privateTags}
                />
            {/if}
        </div>

        <div
            class="text-muted-foreground flex min-h-14 items-center gap-3 border-t py-2 pr-2 pl-4 text-sm"
        >
            <span>
                Показано <span class="text-foreground font-medium tabular-nums">{shown}</span>
                из {total}
            </span>
            {#if count > 0}
                <button
                    type="button"
                    onclick={clearMarkerFilter}
                    class="text-destructive ml-auto shrink-0 rounded-md px-2 py-2.5 underline-offset-4 hover:underline"
                >
                    сбросить все
                </button>
            {/if}
        </div>
    </aside>
{/if}
