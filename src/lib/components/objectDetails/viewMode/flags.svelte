<script lang="ts">
    import Tooltip from '$lib/components/tooltip.svelte';
    import LockOpenIcon from '@lucide/svelte/icons/lock-open';
    import LockIcon from '@lucide/svelte/icons/lock';
    import GhostIcon from '@lucide/svelte/icons/ghost';
    import UserCheckIcon from '@lucide/svelte/icons/user-check';

    interface Props {
        isPublic: boolean;
        isVisited: boolean;
        isRemoved: boolean;
    }

    let {isPublic, isVisited, isRemoved}: Props = $props();
</script>

<span class="text-muted-foreground flex gap-1">
    {#if isPublic}
        <Tooltip>
            {#snippet button()}
                <LockOpenIcon class="size-4" />
            {/snippet}
            Публичная
        </Tooltip>
    {:else}
        <Tooltip>
            {#snippet button()}
                <LockIcon class="size-4" />
            {/snippet}
            Приватная
        </Tooltip>
    {/if}
    {#if isVisited}
        <Tooltip>
            {#snippet button()}
                <UserCheckIcon class="size-4" />
            {/snippet}
            Посещена
        </Tooltip>
    {/if}
    {#if isRemoved}
        <Tooltip>
            {#snippet button()}
                <GhostIcon class="size-4" />
            {/snippet}
            Утрачена
        </Tooltip>
    {/if}
</span>
