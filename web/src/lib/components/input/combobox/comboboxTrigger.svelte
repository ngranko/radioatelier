<script lang="ts">
    import {PopoverTrigger} from '$lib/components/ui/popover';
    import {Button} from '$lib/components/ui/button';
    import {cn} from '$lib/utils.js';
    import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
    import XIcon from '@lucide/svelte/icons/x';
    import ComboboxValue from '$lib/components/input/combobox/comboboxValue.svelte';
    import ClearButton from '$lib/components/input/combobox/clearButton.svelte';
    import type {Option} from '$lib/interfaces/option';

    interface Props {
        onClear(e: MouseEvent): void;
        onChange(option: Option): void;
        selectedOptions: Option[];
        isOpen: boolean;
        labelField?: string;
        multiple?: boolean;
        placeholder?: string;
        error?: boolean;
        disabled?: boolean;
        class?: string;
        wrapperClass?: string;
    }

    let {
        onChange,
        onClear,
        selectedOptions,
        isOpen,
        labelField = 'name',
        multiple = false,
        placeholder = 'Выберите...',
        error = false,
        disabled = false,
        class: className,
        wrapperClass,
    }: Props = $props();
</script>

<PopoverTrigger {disabled} class={cn(wrapperClass)}>
    <Button
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        class={cn(
            'bg-background/50 dark:bg-background/30 h-auto min-h-12 w-full justify-between px-4 py-2 font-medium whitespace-normal',
            'focus:border-primary focus:ring-primary/30 focus:ring-4 dark:focus:ring-2',
            !selectedOptions.length ? 'text-muted-foreground/40' : '',
            error ? 'border-destructive' : '',
            className,
        )}
        {disabled}
    >
        <ComboboxValue {selectedOptions} {labelField} {multiple} {placeholder} {onChange} />
        <div class="flex items-center gap-1">
            {#if multiple && selectedOptions.length > 0 && !disabled}
                <ClearButton onClick={onClear} />
            {/if}

            <ChevronDownIcon class="size-4 opacity-50" />
        </div>
    </Button>
</PopoverTrigger>
