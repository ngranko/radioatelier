<script lang="ts">
    import XIcon from '@lucide/svelte/icons/x';
    import {Badge} from '$lib/components/ui/badge';
    import type {Option} from '$lib/interfaces/option';

    interface Props {
        onChange(option: Option): void;
        selectedOptions: Option[];
        labelField?: string;
        multiple?: boolean;
        placeholder?: string;
    }

    let {
        onChange,
        selectedOptions,
        labelField = 'name',
        multiple = false,
        placeholder = 'Выберите...',
    }: Props = $props();

    const displayValue = $derived(
        selectedOptions[0] ? selectedOptions[0][labelField] : placeholder,
    );
</script>

<div class="flex flex-1 flex-wrap gap-1 truncate">
    {#if multiple && selectedOptions.length > 0}
        {#each selectedOptions as option}
            <Badge variant="secondary">
                {option.name}
                <button
                    type="button"
                    onclick={() => onChange(option)}
                    class="hover:bg-accent rounded-sm p-0.5"
                >
                    <XIcon class="size-3" />
                </button>
            </Badge>
        {/each}
    {:else}
        <span class="truncate">{displayValue}</span>
    {/if}
</div>
