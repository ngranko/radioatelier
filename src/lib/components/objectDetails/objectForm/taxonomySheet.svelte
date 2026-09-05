<script lang="ts">
    import type {Id} from '$convex/_generated/dataModel';
    import CategoryBadge from '$lib/components/categoryBadge.svelte';
    import {Input} from '$lib/components/ui/input';
    import type {Option} from '$lib/interfaces/option';
    import {cn} from '$lib/utils.js';
    import CheckIcon from '@lucide/svelte/icons/check';
    import PlusIcon from '@lucide/svelte/icons/plus';
    import XIcon from '@lucide/svelte/icons/x';
    import {Portal} from 'bits-ui';
    import {tick} from 'svelte';
    import {toast} from 'svelte-sonner';

    type Section = 'category' | 'tags' | 'privateTags';

    interface Props {
        categories: Option[];
        tagOptions: Option[];
        privateTagOptions: Option[];
        category: string | undefined;
        tags: string[];
        privateTags: string[];
        onCreate(section: Section, name: string): Promise<string>;
        onClose(): void;
    }

    let {
        categories,
        tagOptions,
        privateTagOptions,
        category = $bindable(),
        tags = $bindable(),
        privateTags = $bindable(),
        onCreate,
        onClose,
    }: Props = $props();

    const sections: {id: Section; label: string}[] = [
        {id: 'category', label: 'категория'},
        {id: 'tags', label: 'теги'},
        {id: 'privateTags', label: 'приватные'},
    ];

    let section = $state<Section>('category');
    let query = $state('');
    let cursor = $state(0);
    let isCreating = $state(false);
    let listElement = $state<HTMLElement>();
    let queryInput = $state<HTMLInputElement | null>(null);

    const catalog = $derived.by(() => {
        switch (section) {
            case 'category':
                return categories;
            case 'tags':
                return tagOptions;
            case 'privateTags':
                return privateTagOptions;
            default:
                return [];
        }
    });
    const selectedIds = $derived.by(() => {
        switch (section) {
            case 'category':
                return category ? [category] : [];
            case 'tags':
                return tags;
            case 'privateTags':
                return privateTags;
            default:
                return [];
        }
    });
    const matches = $derived(
        catalog.filter(option => option.name.toLowerCase().includes(query.trim().toLowerCase())),
    );
    const canCreate = $derived.by(() => {
        const name = query.trim();
        return (
            Boolean(name) &&
            !catalog.some(option => option.name.toLowerCase() === name.toLowerCase())
        );
    });
    const rowCount = $derived(matches.length + (canCreate ? 1 : 0));
    const summary = $derived.by(() => {
        if (section === 'category') {
            return categories.find(item => item.id === category)?.name ?? 'ничего не выбрано';
        }
        return selectedIds.length ? `выбрано: ${selectedIds.length}` : 'ничего не выбрано';
    });

    function select(id: string) {
        switch (section) {
            case 'category':
                category = id;
                break;
            case 'tags':
                tags = toggle(tags, id);
                break;
            case 'privateTags':
                privateTags = toggle(privateTags, id);
                break;
            default:
                break;
        }
    }

    function toggle(ids: string[], id: string): string[] {
        return ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id];
    }

    function apply(id: string, row: number) {
        select(id);
        // The row under the pointer must not move: only a cleared query re-lists everything,
        // and only then does the cursor go back to the top.
        if (query) {
            query = '';
            cursor = 0;
        } else {
            cursor = row;
        }
        // after the selection the field is emptied and focused again, ready for the next query.
        returnFocusToQuery();
    }

    async function create() {
        if (isCreating) {
            return;
        }
        isCreating = true;
        try {
            select(await onCreate(section, query.trim()));
            query = '';
            cursor = 0;
        } catch {
            toast.error(`Не удалось создать ${section === 'category' ? 'категорию' : 'тег'}`);
        } finally {
            isCreating = false;
            returnFocusToQuery();
        }
    }

    function returnFocusToQuery() {
        void tick().then(() => queryInput?.focus());
    }

    $effect(() => {
        queryInput?.focus();
    });

    function activate(row: number) {
        if (canCreate && row === 0) {
            void create();
            return;
        }
        const option = matches[canCreate ? row - 1 : row];
        if (option) {
            apply(option.id, row);
        }
    }

    function moveCursor(step: number) {
        if (rowCount === 0) {
            return;
        }
        cursor = (cursor + step + rowCount) % rowCount;
        listElement?.querySelector(`[data-row="${cursor}"]`)?.scrollIntoView({block: 'nearest'});
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            moveCursor(event.key === 'ArrowDown' ? 1 : -1);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            activate(cursor);
        } else if (event.key === 'Escape') {
            onClose();
        }
    }

    function switchTo(next: Section) {
        section = next;
        query = '';
        cursor = 0;
        returnFocusToQuery();
    }

    function clearSection() {
        switch (section) {
            case 'category':
                category = undefined;
                break;
            case 'tags':
                tags = [];
                break;
            case 'privateTags':
                privateTags = [];
                break;
            default:
                break;
        }
    }
</script>

<!-- the sheet is portalled so that it dims the whole card, header row included -->
<Portal to="[data-details-sheet]">
    <div class="absolute inset-0 z-10 flex flex-col justify-end overflow-hidden rounded-2xl">
        <button
            type="button"
            class="bg-foreground/20 absolute inset-0"
            aria-label="Закрыть"
            onclick={onClose}
        ></button>
        <div
            class="bg-background relative flex max-h-[85%] min-h-0 flex-col rounded-t-2xl border-t shadow-2xl"
        >
            <div class="flex items-center gap-2 border-b px-4 py-3">
                <span class="flex-1 text-base">категория и теги</span>
                <button
                    type="button"
                    onclick={onClose}
                    aria-label="Закрыть"
                    class="text-muted-foreground hover:text-foreground rounded-sm p-0.5"
                >
                    <XIcon class="size-5" />
                </button>
            </div>

            <div class="flex gap-1 p-2">
                {#each sections as item (item.id)}
                    <button
                        type="button"
                        onclick={() => switchTo(item.id)}
                        class={cn(
                            'flex-1 rounded-lg py-1.5 text-sm transition-colors',
                            section === item.id
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-accent',
                        )}
                    >
                        {item.label}
                    </button>
                {/each}
            </div>

            <div class="text-muted-foreground flex h-9 items-center gap-2 px-4 text-sm">
                <span class="min-w-0 flex-1 truncate">{summary}</span>
                {#if selectedIds.length > 0}
                    <button
                        type="button"
                        onclick={clearSection}
                        class="text-destructive shrink-0 underline-offset-4 hover:underline"
                    >
                        снять все
                    </button>
                {/if}
            </div>

            <div class="flex min-h-0 flex-1 flex-col gap-2 px-4 pb-4">
                <Input
                    type="text"
                    placeholder="Поиск или новое имя..."
                    autocomplete="off"
                    autocorrect="off"
                    spellcheck="false"
                    data-1p-ignore
                    data-lpignore="true"
                    data-bwignore
                    data-form-type="other"
                    bind:ref={queryInput}
                    bind:value={query}
                    oninput={() => (cursor = 0)}
                    onkeydown={handleKeydown}
                />
                <div bind:this={listElement} class="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
                    {#if canCreate}
                        <button
                            type="button"
                            data-row="0"
                            disabled={isCreating}
                            onclick={create}
                            onpointerenter={() => (cursor = 0)}
                            class={cn(
                                'text-primary flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm',
                                cursor === 0 && 'bg-accent',
                            )}
                        >
                            <PlusIcon class="size-3.5 shrink-0" />
                            Создать «{query.trim()}»
                        </button>
                    {/if}
                    {#each matches as option, index (option.id)}
                        {@const row = canCreate ? index + 1 : index}
                        {@const isSelected = selectedIds.includes(option.id)}
                        <button
                            type="button"
                            data-row={row}
                            onclick={() => apply(option.id, row)}
                            onpointerenter={() => (cursor = row)}
                            class={cn(
                                'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm',
                                cursor === row && 'bg-accent',
                                isSelected && 'font-medium',
                            )}
                        >
                            <CheckIcon
                                class={cn('size-3.5 shrink-0', !isSelected && 'opacity-0')}
                            />
                            {#if section === 'category'}
                                <CategoryBadge
                                    name={option.name}
                                    categoryId={option.id as Id<'categories'>}
                                    showName={false}
                                    size="sm"
                                />
                            {/if}
                            <span class="min-w-0 flex-1 break-words">{option.name}</span>
                        </button>
                    {:else}
                        <p class="text-muted-foreground px-3 py-6 text-center text-sm">
                            Не найдено
                        </p>
                    {/each}
                </div>
            </div>
        </div>
    </div>
</Portal>
