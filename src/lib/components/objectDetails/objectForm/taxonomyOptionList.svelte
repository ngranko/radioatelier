<script lang="ts" module>
    export const CREATE_ROW_ID = 'create';

    export function optionElementId(listId: string, optionId: string) {
        return `${listId}-${optionId}`;
    }
</script>

<script lang="ts">
    import type {Id} from '$convex/_generated/dataModel';
    import CategoryBadge from '$lib/components/categoryBadge.svelte';
    import Spinner from '$lib/components/spinner.svelte';
    import type {Option} from '$lib/interfaces/option';
    import {cn} from '$lib/utils.js';
    import CheckIcon from '@lucide/svelte/icons/check';
    import PlusIcon from '@lucide/svelte/icons/plus';

    interface Props {
        id: string;
        label: string;
        multiple: boolean;
        options: Option[];
        selectedIds: string[];
        createName: string | undefined;
        isCreating: boolean;
        withBadges: boolean;
        cursor: number | undefined;
        listElement?: HTMLElement;
        onCreate(): void;
        onPick(id: string): void;
        onPoint(row: number): void;
    }

    let {
        id,
        label,
        multiple,
        options,
        selectedIds,
        createName,
        isCreating,
        withBadges,
        cursor,
        listElement = $bindable(),
        onCreate,
        onPick,
        onPoint,
    }: Props = $props();

    const rowClass =
        'flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm pointer-coarse:py-3';

    function pointAt(event: PointerEvent, row: number) {
        if (event.pointerType === 'mouse') {
            onPoint(row);
        }
    }

    function rowStateClass(isSelected: boolean, isCursor: boolean) {
        return cn(
            isSelected && 'bg-primary/10 dark:bg-primary/20 font-medium',
            isCursor &&
                (isSelected
                    ? 'pointer-fine:bg-primary/15 dark:pointer-fine:bg-primary/25'
                    : 'pointer-fine:bg-muted'),
        );
    }
</script>

<!-- focus stays in the search input, which walks these rows through aria-activedescendant,
     so the rows themselves are kept out of the tab order -->
<div
    bind:this={listElement}
    {id}
    role="listbox"
    aria-label={label}
    aria-multiselectable={multiple}
    class="-mx-1 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-1"
>
    {#each options as option, row (option.id)}
        {@const isSelected = selectedIds.includes(option.id)}
        <button
            type="button"
            role="option"
            tabindex="-1"
            id={optionElementId(id, option.id)}
            aria-selected={isSelected}
            data-row={row}
            onclick={() => onPick(option.id)}
            onpointerenter={event => pointAt(event, row)}
            class={cn(rowClass, rowStateClass(isSelected, cursor === row))}
        >
            <CheckIcon
                class={cn('text-primary mt-0.75 size-3.5 shrink-0', !isSelected && 'opacity-0')}
            />
            {#if withBadges}
                <CategoryBadge
                    name={option.name}
                    categoryId={option.id as Id<'categories'>}
                    showName={false}
                    size="sm"
                    class="mt-0.5"
                />
            {/if}
            <span class="min-w-0 flex-1 wrap-break-word">
                {option.name}
            </span>
        </button>
    {/each}
    {#if createName}
        <button
            type="button"
            role="option"
            tabindex="-1"
            id={optionElementId(id, CREATE_ROW_ID)}
            aria-selected="false"
            data-row={options.length}
            disabled={isCreating}
            onclick={onCreate}
            onpointerenter={event => pointAt(event, options.length)}
            class={cn(rowClass, 'text-primary', rowStateClass(false, cursor === options.length))}
        >
            {#if isCreating}
                <Spinner class="mt-0.75 size-3.5 shrink-0" />
                <span class="min-w-0 flex-1 wrap-break-word">Создаю «{createName}»</span>
            {:else}
                <PlusIcon class="mt-0.75 size-3.5 shrink-0" />
                <span class="min-w-0 flex-1 wrap-break-word">Создать «{createName}»</span>
            {/if}
        </button>
    {/if}
</div>
{#if options.length === 0 && !createName}
    <p class="text-muted-foreground px-3 py-6 text-center text-sm">Не найдено</p>
{/if}
