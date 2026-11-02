<script lang="ts">
    import {api} from '$convex/_generated/api';
    import LoadingDots from '$lib/components/loadingDots.svelte';
    import RoutedDialog from '$lib/components/routedDialog.svelte';
    import TaxonomyRow from '$lib/components/taxonomies/taxonomyRow.svelte';
    import {Content, Title, Footer} from '$lib/components/ui/dialog';
    import {DialogClose} from '$lib/components/ui/dialog/index.js';
    import {Input} from '$lib/components/ui/input';
    import type {TaxonomyEntry, TaxonomyRowMode, TaxonomyType} from '$lib/interfaces/taxonomy';
    import {cn} from '$lib/utils.js';
    import SearchIcon from '@lucide/svelte/icons/search';
    import TagsIcon from '@lucide/svelte/icons/tags';
    import {useQuery} from 'convex-svelte';

    interface Props {
        isOpen: boolean;
    }

    let {isOpen = $bindable()}: Props = $props();

    const sections: {type: TaxonomyType; label: string; searchPlaceholder: string}[] = [
        {type: 'category', label: 'категории', searchPlaceholder: 'Поиск категорий...'},
        {type: 'tag', label: 'теги', searchPlaceholder: 'Поиск тегов...'},
        {type: 'privateTag', label: 'приватные', searchPlaceholder: 'Поиск приватных тегов...'},
    ];

    const currentUser = useQuery(api.users.current, {});
    const taxonomies = useQuery(api.taxonomies.list, {});

    let pickedType = $state<TaxonomyType>('category');
    let searchQuery = $state('');
    let activeRow = $state<{id: string; mode: TaxonomyRowMode} | null>(null);

    // Without the shared vocabulary there is only one list to show, so the
    // picked tab cannot lead anywhere but the private tags.
    const isAdmin = $derived(currentUser.data?.role === 'admin');
    const activeType = $derived<TaxonomyType>(isAdmin ? pickedType : 'privateTag');
    // Left empty until the user resolves, so an admin never sees the private-tag
    // heading flash first.
    const heading = $derived.by(() => {
        if (!currentUser.data) {
            return null;
        }
        return isAdmin
            ? {
                  title: 'Категории и теги',
                  hint: 'Переименование, объединение и удаление по всему архиву',
              }
            : {title: 'Приватные теги', hint: 'Переименование, объединение и удаление ваших тегов'};
    });
    const activeSection = $derived(sections.find(section => section.type === activeType)!);
    const listKeyByType = {category: 'categories', tag: 'tags', privateTag: 'privateTags'} as const;
    const entries = $derived<TaxonomyEntry[]>(taxonomies.data?.[listKeyByType[activeType]] ?? []);
    const visibleEntries = $derived.by(() => {
        const search = searchQuery.trim().toLowerCase();
        return search
            ? entries.filter(entry => entry.name.toLowerCase().includes(search))
            : entries;
    });

    function pickSection(type: TaxonomyType) {
        pickedType = type;
        activeRow = null;
    }

    // A row's pending action can settle after another row took over, and its
    // completion must not close that other row's editor.
    function changeRowMode(id: string, mode: TaxonomyRowMode) {
        if (mode !== 'view') {
            activeRow = {id, mode};
        } else if (activeRow?.id === id) {
            activeRow = null;
        }
    }

    function closeActiveRowFirst(event: Event) {
        if (activeRow) {
            event.preventDefault();
            activeRow = null;
        }
    }

    $effect(() => {
        if (!isOpen) {
            searchQuery = '';
            activeRow = null;
        }
    });
</script>

<RoutedDialog bind:isOpen>
    <Content
        class="flex max-h-[85vh] flex-col overflow-hidden border-t-0 p-0 sm:max-w-lg"
        onEscapeKeydown={closeActiveRowFirst}
    >
        <div
            class="from-primary via-primary/60 absolute top-0 right-0 left-0 h-0.5 bg-linear-to-r to-transparent"
        ></div>
        <div class="relative shrink-0 px-6 pt-6 pb-4">
            <div
                class="from-primary/[0.07] via-primary/3 absolute inset-0 bg-linear-to-br to-transparent"
            ></div>
            <div class="relative flex items-center gap-3.5">
                <div
                    class="bg-primary/10 ring-primary/20 flex size-10 shrink-0 items-center justify-center rounded-xl ring-1"
                >
                    <TagsIcon class="text-primary size-4.5" />
                </div>
                <div>
                    <Title class="min-h-7 text-lg font-semibold tracking-[-0.01em]">
                        {heading?.title}
                    </Title>
                    <p class="text-muted-foreground mt-0.5 min-h-4 text-xs leading-snug">
                        {heading?.hint}
                    </p>
                </div>
            </div>
        </div>

        <div class="shrink-0 space-y-3 px-6 pb-3">
            {#if isAdmin}
                <div class="flex gap-1">
                    {#each sections as section (section.type)}
                        <button
                            type="button"
                            onclick={() => pickSection(section.type)}
                            class={cn(
                                'flex-1 rounded-lg py-1.5 text-sm transition-colors',
                                activeType === section.type
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-accent',
                            )}
                        >
                            {section.label}
                        </button>
                    {/each}
                </div>
            {/if}
            <div class="relative">
                <SearchIcon
                    class="text-muted-foreground/50 pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
                />
                <Input
                    type="text"
                    placeholder={activeSection.searchPlaceholder}
                    class="pl-10"
                    bind:value={searchQuery}
                    oninput={() => (activeRow = null)}
                />
            </div>
        </div>

        <div class="min-h-0 grow overflow-y-auto px-3 pb-4">
            {#each visibleEntries as entry (entry.id)}
                <TaxonomyRow
                    {entry}
                    type={activeType}
                    siblings={entries}
                    mode={activeRow?.id === entry.id ? activeRow.mode : 'view'}
                    onModeChange={mode => changeRowMode(entry.id, mode)}
                />
            {:else}
                <div class="text-muted-foreground px-3 py-8 text-center text-sm">
                    {#if taxonomies.error}
                        Не удалось загрузить список
                    {:else if taxonomies.isLoading}
                        <LoadingDots />
                    {:else if entries.length > 0}
                        Ничего не найдено
                    {:else if activeType === 'privateTag'}
                        Приватных тегов пока нет. Они создаются в форме объекта.
                    {:else}
                        Здесь пока пусто
                    {/if}
                </div>
            {/each}
        </div>

        <Footer class="border-border/50 bg-muted/20 shrink-0 gap-3 border-t px-6 py-4">
            <DialogClose>Закрыть</DialogClose>
        </Footer>
    </Content>
</RoutedDialog>
