<script module lang="ts">
    interface FlagValues {
        isPublic: boolean;
        isVisited: boolean;
        isRemoved: boolean;
    }

    export function hasAnyFlag({isPublic, isVisited, isRemoved}: FlagValues): boolean {
        return isPublic || isVisited || isRemoved;
    }
</script>

<script lang="ts">
    import GhostIcon from '@lucide/svelte/icons/ghost';
    import LockOpenIcon from '@lucide/svelte/icons/lock-open';
    import UserCheckIcon from '@lucide/svelte/icons/user-check';
    import type {Component} from 'svelte';

    let {isPublic, isVisited, isRemoved}: FlagValues = $props();
</script>

<!-- no wrapper: the chips join whatever wrapping row the parent puts them in -->
{#snippet flag(Icon: Component<{class?: string}>, label: string)}
    <span
        class="border-border text-muted-foreground inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
    >
        <Icon class="size-3" />
        {label}
    </span>
{/snippet}

{#if isVisited}
    {@render flag(UserCheckIcon, 'посещена')}
{/if}
{#if isRemoved}
    {@render flag(GhostIcon, 'утрачена')}
{/if}
{#if isPublic}
    {@render flag(LockOpenIcon, 'публичная')}
{/if}
