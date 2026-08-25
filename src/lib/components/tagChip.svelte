<script lang="ts">
    import {Badge} from '$lib/components/ui/badge';
    import {cn} from '$lib/utils.js';
    import LockIcon from '@lucide/svelte/icons/lock';
    import TagIcon from '@lucide/svelte/icons/tag';

    interface Props {
        name: string;
        isPrivate?: boolean;
    }

    let {name, isPrivate = false}: Props = $props();
</script>

<Badge
    variant="secondary"
    title={name}
    class={cn(
        'max-w-full min-w-0',
        isPrivate
            ? 'border-border bg-muted text-muted-foreground'
            : 'text-primary border-primary/15 bg-primary/10',
    )}
>
    {#if isPrivate}
        <LockIcon class="shrink-0" />
    {:else}
        <TagIcon class="shrink-0" />
    {/if}
    <span class="truncate lowercase">{name}</span>
</Badge>
