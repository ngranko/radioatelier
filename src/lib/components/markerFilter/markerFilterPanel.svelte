<script lang="ts">
    import {onMount, tick} from 'svelte';
    import {fade, fly} from 'svelte/transition';
    import {cubicOut} from 'svelte/easing';
    import {
        markerFilterState,
        closeMarkerFilter,
        clearMarkerFilter,
        selectedFilterCount,
        isFilterSelected,
        type FilterOption,
        type TrayItem,
    } from '$lib/state/markerFilter.svelte';
    import {registerEscapeCloseHandler} from '$lib/utils/escapeClose';
    import MarkerFilterSection from './markerFilterSection.svelte';
    import MarkerFilterTray from './markerFilterTray.svelte';
    import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
    import SearchIcon from '@lucide/svelte/icons/search';
    import XIcon from '@lucide/svelte/icons/x';
    import MapPinIcon from '@lucide/svelte/icons/map-pin';
    import TagIcon from '@lucide/svelte/icons/tag';
    import LockIcon from '@lucide/svelte/icons/lock';

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
        ...categories
            .filter(c => isFilterSelected('categories', c.id))
            .map(c => ({kind: 'categories' as const, id: c.id, name: c.name, color: c.color})),
        ...tags
            .filter(t => isFilterSelected('tags', t.id))
            .map(t => ({kind: 'tags' as const, id: t.id, name: t.name, icon: TagIcon})),
        ...privateTags
            .filter(p => isFilterSelected('privateTags', p.id))
            .map(p => ({kind: 'privateTags' as const, id: p.id, name: p.name, icon: LockIcon})),
    ]);

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
    <div
        class="fixed inset-0 z-10 bg-black/30 backdrop-blur-[2px]"
        transition:fade={{duration: 180}}
        onclick={closeMarkerFilter}
        role="presentation"
    ></div>

    <div
        class="glass fixed inset-2 z-30 flex flex-col overflow-hidden rounded-[22px]
            sm:inset-auto sm:top-2 sm:left-2 sm:max-h-[min(78vh,660px)] sm:w-[420px] sm:max-w-[calc(100%-1rem)]"
        in:fly={{y: -6, duration: 200, easing: cubicOut}}
        out:fly={{y: -6, duration: 150, easing: cubicOut}}
    >
        <div class="border-border flex items-center gap-2 border-b py-2.5 pr-2.5 pl-2">
            <button
                type="button"
                onclick={closeMarkerFilter}
                aria-label="Назад к поиску маркеров"
                class="text-muted-foreground hover:bg-muted/55 hover:text-foreground grid size-[34px]
                    flex-none place-items-center rounded-full transition-colors"
            >
                <ChevronLeftIcon class="size-[18px]" />
            </button>
            <SearchIcon class="text-muted-foreground size-[17px] flex-none" />
            <input
                bind:this={input}
                bind:value={markerFilterState.query}
                placeholder="Фильтр по категориям и тегам…"
                class="placeholder:text-muted-foreground min-w-0 flex-1 border-none bg-transparent text-sm outline-none"
            />
            {#if markerFilterState.query}
                <button
                    type="button"
                    onclick={() => (markerFilterState.query = '')}
                    aria-label="Очистить"
                    class="text-muted-foreground bg-muted/60 grid size-[30px] flex-none place-items-center rounded-full"
                >
                    <XIcon class="size-[13px]" />
                </button>
            {/if}
        </div>

        <MarkerFilterTray items={trayItems} />

        <div class="flex-1 overflow-y-auto px-1.5 py-1">
            {#if noMatches}
                <p class="text-muted-foreground px-5 py-9 text-center text-[13px]">
                    Ничего не найдено по запросу «{markerFilterState.query.trim()}»
                </p>
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
                    label="Личные теги"
                    icon={LockIcon}
                    options={privateTags}
                />
            {/if}
        </div>

        <div
            class="border-border text-muted-foreground flex items-center gap-3 border-t px-3.5 py-2.5 text-xs"
        >
            <span>
                Показано <b class="text-primary text-[13.5px] font-bold tabular-nums">{shown}</b>
                из {total}
            </span>
            {#if count > 0}
                <button
                    type="button"
                    onclick={clearMarkerFilter}
                    class="text-muted-foreground ml-auto text-xs font-semibold"
                >
                    Сбросить · {count}
                </button>
            {/if}
        </div>
    </div>
{/if}
