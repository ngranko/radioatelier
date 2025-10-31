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

    interface Props {
        options: Option[];
        value?: string | string[];
        multiple?: boolean;
        creatable?: boolean;
        placeholder?: string;
        emptyText?: string;
        createLabel?: (value: string) => string;
        onChange?: (value: any) => void;
        onCreate?: (inputValue: string) => Promise<Option>;
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
        if (!query) return false;
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
        } else {
            value = option[valueField];
            onChange?.(value);
            open = false;
            searchValue = '';
        }
    }

    function handleCreate() {
        if (!onCreate || !searchValue) return;
        onCreate(searchValue).then(newOption => {
            if (multiple) {
                value = [...selectedValues, newOption[valueField]];
                onChange?.(value.length > 0 ? value : []);
            } else {
                value = newOption[valueField];
                onChange?.(newOption as any);
                open = false;
            }
            searchValue = '';
        });
    }

    function handleClear(e: MouseEvent) {
        e.stopPropagation();
        if (multiple) {
            value = [];
            onChange?.(null);
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
    <PopoverContent class="p-0">
        <Command>
            <CommandInput
                bind:value={searchValue}
                placeholder="Поиск..."
                onkeydown={(e: KeyboardEvent) => {
                    if (e.key === 'Enter' && showCreateOption) {
                        e.preventDefault();
                        handleCreate();
                    }
                }}
            />

            <CommandList>
                {#if showCreateOption}
                    <CommandItem value={searchValue} onclick={handleCreate} class="text-primary">
                        <PlusIcon class="mr-2 size-4" />
                        {createLabel(searchValue)}
                    </CommandItem>
                {/if}

                {#each options as option}
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
