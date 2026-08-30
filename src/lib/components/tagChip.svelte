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
    }

    let {name, isPrivate = false, onRemove}: Props = $props();
</script>

<Badge
    variant="secondary"
    title={name}
    class={cn(
        'max-w-full min-w-0',
        isPrivate
            ? 'border-border bg-muted text-muted-foreground'
            : 'text-primary border-primary/15 bg-primary/10',
        onRemove && 'pr-1',
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
            onclick={onRemove}
            aria-label="Убрать {name}"
            class="shrink-0 rounded-sm p-1 hover:bg-current/10"
        >
            <XIcon class="size-3.5" />
        </button>
    {/if}
</Badge>
