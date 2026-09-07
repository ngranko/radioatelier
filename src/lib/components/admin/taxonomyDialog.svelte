<script lang="ts">
    import {goto} from '$app/navigation';
    import {api} from '$convex/_generated/api';
    import TaxonomyRow from '$lib/components/admin/taxonomyRow.svelte';
    import {Root as DialogRoot, Content, Title, Footer} from '$lib/components/ui/dialog';
    import {DialogClose} from '$lib/components/ui/dialog/index.js';
    import {Input} from '$lib/components/ui/input';
    import type {TaxonomyEntry, TaxonomyType} from '$lib/interfaces/taxonomy';
    import {cn} from '$lib/utils.js';
    import SearchIcon from '@lucide/svelte/icons/search';
    import TagsIcon from '@lucide/svelte/icons/tags';
    import {useQuery} from 'convex-svelte';
    import {onDestroy} from 'svelte';

    const DIALOG_ANIMATION_DURATION = 200;

    interface Props {
        isOpen: boolean;
    }

    let {isOpen = $bindable()}: Props = $props();

    const sections: {type: TaxonomyType; label: string}[] = [
        {type: 'category', label: 'категории'},
        {type: 'tag', label: 'теги'},
        {type: 'privateTag', label: 'приватные'},
    ];

    const taxonomies = useQuery(api.taxonomies.list, {});

    let activeType = $state<TaxonomyType>('category');
    let searchQuery = $state('');
    let closeRedirectTimer: ReturnType<typeof setTimeout> | undefined;

    const entries = $derived.by((): TaxonomyEntry[] => {
        const data = taxonomies.data;
        if (!data) {
            return [];
        }
        if (activeType === 'category') {
            return data.categories;
        }
        return activeType === 'tag' ? data.tags : data.privateTags;
    });
    const visibleEntries = $derived.by(() => {
        const search = searchQuery.trim().toLowerCase();
        return search ? entries.filter(entry => entry.name.includes(search)) : entries;
    });

    function getIsOpen() {
        return isOpen;
    }

    function clearCloseRedirectTimer() {
        if (closeRedirectTimer !== undefined) {
            clearTimeout(closeRedirectTimer);
            closeRedirectTimer = undefined;
        }
    }

    function setIsOpen(newOpen: boolean) {
        clearCloseRedirectTimer();
        isOpen = newOpen;

        if (!newOpen) {
            searchQuery = '';
            closeRedirectTimer = setTimeout(() => {
                closeRedirectTimer = undefined;
                goto('/');
            }, DIALOG_ANIMATION_DURATION);
        }
    }

    onDestroy(() => {
        clearCloseRedirectTimer();
    });
</script>

<!-- prettier-ignore -->
<DialogRoot bind:open={getIsOpen, setIsOpen}>
    <Content class="flex max-h-[85vh] flex-col overflow-hidden border-t-0 p-0 sm:max-w-lg">
        <div
            class="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-primary via-primary/60 to-transparent"
        ></div>
        <div class="relative shrink-0 px-6 pt-6 pb-4">
            <div
                class="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-primary/[0.03] to-transparent"
            ></div>
            <div class="relative flex items-center gap-3.5">
                <div
                    class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20"
                >
                    <TagsIcon class="size-4.5 text-primary" />
                </div>
                <div>
                    <Title class="text-lg font-semibold tracking-[-0.01em]">
                        Справочники
                    </Title>
                    <p class="text-muted-foreground mt-0.5 text-xs leading-snug">
                        Переименование и удаление по всему архиву
                    </p>
                </div>
            </div>
        </div>

        <div class="shrink-0 space-y-3 px-6 pb-3">
            <div class="bg-muted/50 flex gap-1 rounded-lg p-1">
                {#each sections as section (section.type)}
                    <button
                        type="button"
                        onclick={() => (activeType = section.type)}
                        class={cn(
                            'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                            activeType === section.type
                                ? 'bg-background shadow-sm'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {section.label}
                    </button>
                {/each}
            </div>
            <div class="relative">
                <SearchIcon class="text-muted-foreground/50 pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
                <Input type="text" placeholder="Поиск..." class="pl-10" bind:value={searchQuery} />
            </div>
        </div>

        <div class="min-h-0 grow overflow-y-auto px-6">
            <div class="space-y-2 pb-4">
                {#each visibleEntries as entry (entry.id)}
                    <TaxonomyRow {entry} type={activeType} siblings={entries} />
                {/each}

                {#if taxonomies.error}
                    <div class="text-muted-foreground py-8 text-center text-sm">
                        Не удалось загрузить список
                    </div>
                {:else if !taxonomies.isLoading && visibleEntries.length === 0}
                    <div class="text-muted-foreground py-8 text-center text-sm">
                        Ничего не найдено
                    </div>
                {/if}
            </div>
        </div>

        <Footer class="border-border/50 shrink-0 gap-3 border-t bg-muted/20 px-6 py-4">
            <DialogClose>Закрыть</DialogClose>
        </Footer>
    </Content>
</DialogRoot>
