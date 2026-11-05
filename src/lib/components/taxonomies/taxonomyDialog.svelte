<script lang="ts">
    import {api} from '$convex/_generated/api';
    import DialogHeading from '$lib/components/dialogHeading.svelte';
    import LoadingDots from '$lib/components/loadingDots.svelte';
    import CloseConfirmDialog from '$lib/components/objectDetails/closeConfirmDialog.svelte';
    import RoutedDialog from '$lib/components/routedDialog.svelte';
    import TaxonomyRow from '$lib/components/taxonomies/taxonomyRow.svelte';
    import {buttonVariants} from '$lib/components/ui/button';
    import {Content, Footer} from '$lib/components/ui/dialog';
    import {DialogClose} from '$lib/components/ui/dialog/index.js';
    import {Input} from '$lib/components/ui/input';
    import {List, Root as Tabs, TabsContent, Trigger} from '$lib/components/ui/tabs';
    import type {TaxonomyEntry, TaxonomyRowMode, TaxonomyType} from '$lib/interfaces/taxonomy';
    import SearchIcon from '@lucide/svelte/icons/search';
    import TagsIcon from '@lucide/svelte/icons/tags';
    import {useQuery} from 'convex-svelte';

    interface Props {
        isOpen: boolean;
    }

    let {isOpen = $bindable()}: Props = $props();

    const sections: {type: TaxonomyType; label: string; searchPlaceholder: string}[] = [
        {type: 'category', label: 'Категории', searchPlaceholder: 'Поиск категорий...'},
        {type: 'tag', label: 'Теги', searchPlaceholder: 'Поиск тегов...'},
        {type: 'privateTag', label: 'Приватные', searchPlaceholder: 'Поиск приватных тегов...'},
    ];

    const currentUser = useQuery(api.users.current, {});
    const taxonomies = useQuery(api.taxonomies.list, {});

    let pickedType = $state<TaxonomyType>('category');
    let searchQuery = $state('');
    let activeRow = $state<{id: string; mode: TaxonomyRowMode} | null>(null);
    let draftName = $state('');
    let isDiscardConfirmOpen = $state(false);
    let pendingTransition = () => {};
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
    const renamedId = $derived(activeRow?.mode === 'rename' ? activeRow.id : null);
    const visibleEntries = $derived.by(() => {
        const search = searchQuery.trim().toLowerCase();
        return search
            ? entries.filter(
                  entry => entry.id === renamedId || entry.name.toLowerCase().includes(search),
              )
            : entries;
    });
    const hasPendingRename = $derived(
        renamedId !== null && draftName.trim() !== entries.find(e => e.id === renamedId)?.name,
    );

    function confirmDiscardingRename(transition: () => void) {
        if (hasPendingRename) {
            pendingTransition = transition;
            isDiscardConfirmOpen = true;
        } else {
            transition();
        }
    }

    function discardRename() {
        isDiscardConfirmOpen = false;
        pendingTransition();
    }

    function pickSection(type: string) {
        confirmDiscardingRename(() => {
            pickedType = type as TaxonomyType;
            activeRow = null;
        });
    }

    // A row's pending action can settle after another row took over, and its
    // completion must not close that other row's editor.
    function changeRowMode(entry: TaxonomyEntry, mode: TaxonomyRowMode) {
        if (mode === 'view') {
            if (activeRow?.id === entry.id) {
                activeRow = null;
            }
            return;
        }
        confirmDiscardingRename(() => {
            draftName = entry.name;
            activeRow = {id: entry.id, mode};
        });
    }

    function closeRemovalOnSearch() {
        if (activeRow?.mode === 'remove') {
            activeRow = null;
        }
    }

    function closeActiveRowFirst(event: Event) {
        if (activeRow) {
            event.preventDefault();
            confirmDiscardingRename(() => {
                activeRow = null;
            });
        }
    }

    $effect(() => {
        if (!isOpen) {
            searchQuery = '';
            activeRow = null;
        }
    });
</script>

<RoutedDialog bind:isOpen hasUnsavedChanges={hasPendingRename}>
    <Content
        class="flex max-h-[85vh] flex-col overflow-hidden border-t-0 p-0 max-sm:gap-0 sm:max-w-lg"
        onEscapeKeydown={closeActiveRowFirst}
    >
        <DialogHeading icon={TagsIcon} title={heading?.title} hint={heading?.hint} />

        <Tabs
            bind:value={() => activeType, pickSection}
            activationMode="manual"
            class="min-h-0 grow gap-0"
        >
            <div class="shrink-0 space-y-3 px-6 pb-3 max-sm:pt-4">
                {#if isAdmin}
                    <List class="h-9 w-full pointer-coarse:h-11">
                        {#each sections as section (section.type)}
                            <Trigger value={section.type}>{section.label}</Trigger>
                        {/each}
                    </List>
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
                        oninput={closeRemovalOnSearch}
                    />
                </div>
            </div>

            <TabsContent value={activeType} class="min-h-0 overflow-y-auto px-3 pb-4">
                {#each visibleEntries as entry (entry.id)}
                    <TaxonomyRow
                        {entry}
                        type={activeType}
                        siblings={entries}
                        mode={activeRow?.id === entry.id ? activeRow.mode : 'view'}
                        bind:draftName
                        onModeChange={mode => changeRowMode(entry, mode)}
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
            </TabsContent>
        </Tabs>

        <Footer
            class="border-border/50 bg-muted/20 shrink-0 gap-3 border-t px-6 py-3 max-sm:grid max-sm:auto-cols-fr max-sm:grid-flow-col max-sm:*:h-11 sm:py-4"
        >
            <DialogClose class={buttonVariants({variant: 'outline'})}>Закрыть</DialogClose>
        </Footer>
    </Content>
    <CloseConfirmDialog
        bind:open={isDiscardConfirmOpen}
        title="Вы действительно хотите закрыть переименование?"
        onConfirmClose={discardRename}
    />
</RoutedDialog>
