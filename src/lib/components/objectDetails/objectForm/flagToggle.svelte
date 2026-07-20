<script lang="ts">
    import {cn} from '$lib/utils.ts';
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
        'focus-visible:border-ring focus-visible:ring-ring/50 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        checked
            ? 'border-primary/40 bg-primary/10 text-primary'
            : 'border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground/80',
    )}
>
    <Icon class="size-4" />
    {label}
</button>
<input type="hidden" {name} value={checked ? 'on' : ''} />
