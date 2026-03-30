<script lang="ts">
    import {Popover, PopoverContent} from '$lib/components/ui/popover';
    import {
        Command,
        CommandInput,
        CommandList,
        CommandItem,
        CommandEmpty,
    } from '$lib/components/ui/command';
    import CheckIcon from '@lucide/svelte/icons/check';
    import PlusIcon from '@lucide/svelte/icons/plus';
    import ComboboxTrigger from './combobox/comboboxTrigger.svelte';
    import type {Option} from '$lib/interfaces/option';
    type ComboboxValue = string | string[] | null | undefined;

    interface Props {
        options: Option[];
        value?: string | string[];
        multiple?: boolean;
        creatable?: boolean;
        placeholder?: string;
        createLabel?: (value: string) => string;
        onChange?: (value: ComboboxValue) => void;
        onCreate?: (inputValue: string) => Promise<string>;
        error?: boolean;
        name?: string;
        valueField?: string;
        labelField?: string;
        disabled?: boolean;
        class?: string;
        wrapperClass?: string;
    }

    let {
        options = [],
        value = $bindable(),
        multiple = false,
        creatable = false,
        placeholder = 'Выберите...',
        createLabel = (v: string) => `Создать '${v}'`,
        onChange,
        onCreate,
        error = false,
        name,
        valueField = 'id',
        labelField = 'name',
        disabled = false,
        class: className,
        wrapperClass,
    }: Props = $props();

    let open = $state(false);
    let searchValue = $state('');
    let isCreating = $state(false);
    let createOptionRef = $state<HTMLElement | null>(null);

    const selectedValues = $derived.by(() => {
        if (!value) {
            return [];
        }
        return Array.isArray(value) ? value : [value];
    });

    const selectedOptions = $derived.by(() => {
        return options.filter(opt => selectedValues.includes(opt[valueField]));
    });

    const showCreateOption = $derived.by(() => {
        if (!creatable || !onCreate) {
            return false;
        }
        const query = (searchValue || '').trim();
        if (!query) {
            return false;
        }
        return !options.some(
            opt => String(opt[labelField] || '').toLowerCase() === query.toLowerCase(),
        );
    });

    function handleSelect(option: Option) {
        if (multiple) {
            const newValues = [...selectedValues];
            const index = newValues.indexOf(option[valueField]);
            if (index > -1) {
                newValues.splice(index, 1);
            } else {
                newValues.push(option[valueField]);
            }
            value = newValues;
            onChange?.(value.length > 0 ? value : []);
            searchValue = '';
        } else {
            value = option[valueField];
            onChange?.(value);
            open = false;
            searchValue = '';
        }
    }

    async function handleCreate() {
        if (!onCreate || !searchValue || isCreating) {
            return;
        }

        const query = searchValue.trim();
        if (!query) {
            return;
        }

        isCreating = true;
        try {
            const newOption = await onCreate(query);
            if (multiple) {
                value = [...selectedValues, newOption];
                onChange?.(value.length > 0 ? value : []);
            } else {
                value = newOption;
                onChange?.(value);
                open = false;
            }
            searchValue = '';
        } catch (err) {
            console.error('Failed to create option:', err);
        } finally {
            isCreating = false;
        }
    }

    function isCreateOptionHighlighted() {
        return createOptionRef?.getAttribute('aria-selected') === 'true';
    }

    function handleClear(e: MouseEvent) {
        e.stopPropagation();
        if (multiple) {
            value = [];
            onChange?.([]);
        } else {
            value = undefined;
            onChange?.(null);
        }
    }

    $effect(() => {
        if (!open) {
            searchValue = '';
        }
    });
</script>

{#if name}
    {#if multiple && Array.isArray(value)}
        {#each value as v (v)}
            <input type="hidden" {name} value={v} />
        {/each}
    {:else if !multiple && value}
        <input type="hidden" {name} {value} />
    {/if}
{/if}

<Popover bind:open>
    <ComboboxTrigger
        {labelField}
        {multiple}
        {placeholder}
        {error}
        {disabled}
        {wrapperClass}
        class={className}
        isOpen={open}
        {selectedOptions}
        onChange={handleSelect}
        onClear={handleClear}
    />
    <PopoverContent class="w-(--bits-popover-anchor-width) p-0" align="start">
        <Command>
            <CommandInput
                bind:value={searchValue}
                placeholder="Поиск..."
                onkeydown={(e: KeyboardEvent) => {
                    if (
                        e.key === 'Enter' &&
                        showCreateOption &&
                        !isCreating &&
                        isCreateOptionHighlighted()
                    ) {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCreate();
                    }
                }}
            />

            <CommandList>
                {#if showCreateOption}
                    <CommandItem
                        bind:ref={createOptionRef}
                        value={searchValue}
                        onclick={() => {
                            if (!isCreating) {
                                handleCreate();
                            }
                        }}
                        class="text-primary"
                    >
                        <PlusIcon class="mr-2 size-4" />
                        {createLabel(searchValue)}
                    </CommandItem>
                {/if}

                {#each options as option (option.id)}
                    <CommandItem value={option[labelField]} onclick={() => handleSelect(option)}>
                        <div class="flex items-center gap-2">
                            {#if selectedValues.includes(option[valueField])}
                                <CheckIcon class="size-4" />
                            {/if}
                            <span>{option[labelField]}</span>
                        </div>
                    </CommandItem>
                {/each}

                <CommandEmpty>Не найдено</CommandEmpty>
            </CommandList>
        </Command>
    </PopoverContent>
</Popover>
