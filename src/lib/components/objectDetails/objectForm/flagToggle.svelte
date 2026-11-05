<script lang="ts">
    import {cn} from '$lib/utils.ts';
    import CheckIcon from '@lucide/svelte/icons/check';
    import type {Component} from 'svelte';

    interface Props {
        checked: boolean;
        label: string;
        icon: Component<{class?: string}>;
        name: string;
        disabled?: boolean;
    }

    let {checked = $bindable(false), label, icon: Icon, name, disabled = false}: Props = $props();
</script>

<button
    type="button"
    role="switch"
    aria-checked={checked}
    {disabled}
    onclick={() => (checked = !checked)}
    class={cn(
        'focus-visible:border-ring focus-visible:ring-ring/50 relative inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        'pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:top-1/2 pointer-coarse:after:h-11 pointer-coarse:after:-translate-y-1/2',
        checked
            ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
            : 'border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground/80',
    )}
>
    <span class="relative shrink-0">
        <Icon class="size-4" />
        {#if checked}
            <CheckIcon
                strokeWidth={4}
                class="bg-primary-foreground text-primary ring-primary absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full p-px ring-2"
            />
        {/if}
    </span>
    {label}
</button>
<input type="hidden" {name} value={checked ? 'on' : ''} />
