<script lang="ts">
    import TaxonomyOptionList, {
        CREATE_ROW_ID,
        optionElementId,
    } from '$lib/components/objectDetails/objectForm/taxonomyOptionList.svelte';
    import {Button} from '$lib/components/ui/button';
    import {Input} from '$lib/components/ui/input';
    import * as Tabs from '$lib/components/ui/tabs';
    import type {Option} from '$lib/interfaces/option';
    import CheckIcon from '@lucide/svelte/icons/check';
    import {Dialog} from 'bits-ui';
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
        {id: 'category', label: 'Категория'},
        {id: 'tags', label: 'Теги'},
        {id: 'privateTags', label: 'Приватные'},
    ];

    const listId = $props.id();

    let section = $state<Section>('category');
    let query = $state('');
    let cursor = $state(0);
    let isCursorSteered = $state(false);
    let isCreating = $state(false);
    let listElement = $state<HTMLElement>();
    let queryInput = $state<HTMLInputElement | null>(null);
    let overlayElement = $state<HTMLElement | null>(null);
    let contentElement = $state<HTMLElement | null>(null);

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
    const matches = $derived.by(() => {
        const search = query.trim().toLowerCase();
        const found = catalog.filter(option => option.name.toLowerCase().includes(search));
        // once a catalog runs to a hundred tags, what is already picked is the part
        // that has to stay reachable without scrolling
        return [
            ...found.filter(option => selectedIds.includes(option.id)),
            ...found.filter(option => !selectedIds.includes(option.id)),
        ];
    });
    const canCreate = $derived.by(() => {
        const name = query.trim();
        return (
            Boolean(name) &&
            !catalog.some(option => option.name.toLowerCase() === name.toLowerCase())
        );
    });
    const rowCount = $derived(matches.length + (canCreate ? 1 : 0));
    const cursorRow = $derived(isCursorSteered || query.trim() ? cursor : undefined);
    const cursorOptionId = $derived.by(() => {
        if (cursorRow === undefined) {
            return undefined;
        }
        return isCreateRow(cursorRow) ? CREATE_ROW_ID : optionAt(cursorRow)?.id;
    });
    const summary = $derived.by(() => {
        if (section === 'category') {
            return categories.find(item => item.id === category)?.name ?? 'Ничего не выбрано';
        }
        return selectedIds.length ? `Выбрано: ${selectedIds.length}` : 'Ничего не выбрано';
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

    function apply(id: string) {
        select(id);
        query = '';
        // the toggled option is re-sorted into or out of the pinned block, so the cursor
        // follows the option itself rather than the row it used to sit on
        void tick().then(() =>
            moveCursorTo(
                Math.max(
                    matches.findIndex(option => option.id === id),
                    0,
                ),
            ),
        );
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
            void tick().then(() => moveCursorTo(0));
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
        const card = contentElement?.parentElement;
        if (!card || !overlayElement) {
            return;
        }
        const covered = [...card.children].filter(
            (child): child is HTMLElement =>
                child instanceof HTMLElement &&
                child !== overlayElement &&
                child !== contentElement &&
                !child.inert,
        );
        covered.forEach(element => (element.inert = true));
        return () => covered.forEach(element => (element.inert = false));
    });

    function focusQueryOnOpen(event: Event) {
        event.preventDefault();
        queryInput?.focus();
    }

    function activate(row: number) {
        if (isCreateRow(row)) {
            void create();
            return;
        }
        const option = optionAt(row);
        if (option) {
            apply(option.id);
        }
    }

    function optionAt(row: number): Option | undefined {
        return matches[row];
    }

    function isCreateRow(row: number) {
        return canCreate && row === matches.length;
    }

    function moveCursor(step: number) {
        if (rowCount === 0) {
            return;
        }
        const next = cursorRow === undefined ? cursor : (cursor + step + rowCount) % rowCount;
        isCursorSteered = true;
        moveCursorTo(next);
    }

    function pointCursorAt(row: number) {
        isCursorSteered = true;
        cursor = row;
    }

    function moveCursorTo(row: number) {
        cursor = row;
        listElement?.querySelector(`[data-row="${row}"]`)?.scrollIntoView({block: 'nearest'});
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            moveCursor(event.key === 'ArrowDown' ? 1 : -1);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (cursorRow !== undefined) {
                isCursorSteered = true;
                activate(cursorRow);
            }
        }
    }

    function switchTo(next: Section) {
        section = next;
        query = '';
        cursor = 0;
    }

    function returnToTop() {
        cursor = 0;
        returnFocusToQuery();
    }

    function clearSection() {
        if (section === 'tags') {
            tags = [];
        } else if (section === 'privateTags') {
            privateTags = [];
        }
    }
</script>

<Dialog.Root open onOpenChange={open => !open && onClose()}>
    <!-- portalled into the card so that it dims the whole card, header row included -->
    <Dialog.Portal to="[data-details-sheet]">
        <Dialog.Overlay
            bind:ref={overlayElement}
            class="bg-foreground/20 absolute inset-0 z-10 rounded-2xl"
        />
        <!-- data-slot marks it as an open layer, so Escape closes the sheet, not the card. The
             height is fixed for every section and query because the sheet is anchored to the
             bottom: fitting it to the list would move the tabs and the field under the finger -->
        <Dialog.Content
            bind:ref={contentElement}
            data-slot="dialog-content"
            preventScroll={false}
            onOpenAutoFocus={focusQueryOnOpen}
            class="bg-background absolute inset-x-0 bottom-0 z-10 flex h-[85%] flex-col rounded-2xl border-t shadow-2xl outline-none"
        >
            <div class="flex items-center gap-2 border-b px-4 py-3">
                <Dialog.Title class="flex-1 text-base">Категория и теги</Dialog.Title>
                <Button
                    variant="ghost"
                    size="sm"
                    onclick={onClose}
                    class="text-primary hover:text-primary -my-1 -mr-2 rounded-lg text-sm"
                >
                    <CheckIcon />
                    Готово
                </Button>
            </div>

            <Tabs.Root
                value={section}
                onValueChange={value => switchTo(value as Section)}
                class="min-h-0 flex-1 gap-0"
            >
                <Tabs.List class="mx-4 my-2 h-9 w-auto">
                    {#each sections as item (item.id)}
                        <Tabs.Trigger value={item.id} onclick={returnFocusToQuery}>
                            {item.label}
                        </Tabs.Trigger>
                    {/each}
                </Tabs.List>

                <Tabs.Content value={section} class="flex min-h-0 flex-col">
                    <div
                        class="text-muted-foreground flex h-9 shrink-0 items-center gap-2 px-4 text-sm pointer-coarse:h-11"
                    >
                        <span class="min-w-0 flex-1 truncate">{summary}</span>
                        {#if section !== 'category' && selectedIds.length > 0}
                            <button
                                type="button"
                                onclick={clearSection}
                                class="text-primary -mr-2 shrink-0 self-stretch rounded-md px-2 underline-offset-4 hover:underline"
                            >
                                Снять все
                            </button>
                        {/if}
                    </div>

                    <div class="flex min-h-0 flex-1 flex-col gap-2 px-4 pb-4">
                        <Input
                            type="text"
                            class="shrink-0"
                            placeholder="Поиск или новое имя..."
                            autocomplete="off"
                            autocorrect="off"
                            spellcheck="false"
                            data-1p-ignore
                            data-lpignore="true"
                            data-bwignore
                            data-form-type="other"
                            role="combobox"
                            aria-controls={listId}
                            aria-expanded="true"
                            aria-autocomplete="list"
                            aria-activedescendant={cursorOptionId &&
                                optionElementId(listId, cursorOptionId)}
                            bind:ref={queryInput}
                            bind:value={query}
                            oninput={returnToTop}
                            onkeydown={handleKeydown}
                        />
                        {#if section === 'privateTags'}
                            <p class="text-muted-foreground pt-1 text-sm">
                                Приватные теги видны только вам
                            </p>
                        {/if}
                        <TaxonomyOptionList
                            id={listId}
                            label={sections.find(item => item.id === section)?.label ?? ''}
                            multiple={section !== 'category'}
                            options={matches}
                            {selectedIds}
                            createName={canCreate ? query.trim() : undefined}
                            {isCreating}
                            withBadges={section === 'category'}
                            cursor={cursorRow}
                            bind:listElement
                            onCreate={create}
                            onPick={apply}
                            onPoint={pointCursorAt}
                        />
                    </div>
                </Tabs.Content>
            </Tabs.Root>
        </Dialog.Content>
    </Dialog.Portal>
</Dialog.Root>
