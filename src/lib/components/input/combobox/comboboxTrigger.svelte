<script lang="ts">
    import ComboboxValue from '$lib/components/input/combobox/comboboxValue.svelte';
    import {Button} from '$lib/components/ui/button';
    import {PopoverTrigger} from '$lib/components/ui/popover';
    import type {Option} from '$lib/interfaces/option';
    import {cn} from '$lib/utils.js';
    import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

    interface Props {
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
        <ChevronDownIcon class="size-4 shrink-0 opacity-50" />
    </Button>
</PopoverTrigger>
