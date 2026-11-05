<script lang="ts">
    import {Badge} from '$lib/components/ui/badge';
    import {cn} from '$lib/utils.js';
    import LockIcon from '@lucide/svelte/icons/lock';
    import TagIcon from '@lucide/svelte/icons/tag';
    import XIcon from '@lucide/svelte/icons/x';

    interface Props {
        name: string;
        isPrivate?: boolean;
        onRemove?: () => void;
        disabled?: boolean;
    }

    let {name, isPrivate = false, onRemove, disabled = false}: Props = $props();
</script>

<Badge
    variant="secondary"
    title={name}
    class={cn(
        'max-w-full min-w-0',
        isPrivate
            ? 'border-border bg-muted text-muted-foreground'
            : 'dark:text-primary border-primary/15 bg-primary/10 text-[color-mix(in_oklab,var(--primary)_80%,var(--foreground))]',
        onRemove && 'overflow-visible pr-1',
    )}
>
    {#if isPrivate}
        <LockIcon class="shrink-0" />
    {:else}
        <TagIcon class="shrink-0" />
    {/if}
    <span class="truncate lowercase">{name}</span>
    {#if onRemove}
        <button
            type="button"
            {disabled}
            onclick={onRemove}
            aria-label="Убрать {name}"
            class={cn(
                'shrink-0 rounded-sm p-1 hover:bg-current/10 disabled:pointer-events-none',
                'relative pointer-coarse:after:absolute pointer-coarse:after:-inset-y-2.75 pointer-coarse:after:-right-1.25 pointer-coarse:after:-left-4.25',
            )}
        >
            <XIcon class="size-3.5" />
        </button>
    {/if}
</Badge>
