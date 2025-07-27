<script lang="ts">
    import Tooltip from '$lib/components/tooltip.svelte';

    interface Props {
        isPublic: boolean;
        isVisited: boolean;
        isRemoved: boolean;
    }

    let {isPublic, isVisited, isRemoved}: Props = $props();
</script>

<span class="flex gap-1">
    {#if isPublic}
        <Tooltip>
            {#snippet button()}
                <i class="fa-solid fa-lock-open"></i>
            {/snippet}
            Публичная
        </Tooltip>
    {:else}
        <Tooltip>
            {#snippet button()}
                <i class="fa-solid fa-lock"></i>
            {/snippet}
            Приватная
        </Tooltip>
    {/if}
    {#if isVisited}
        <Tooltip>
            {#snippet button()}
                <i class="fa-solid fa-person-circle-check"></i>
            {/snippet}
            Посещена
        </Tooltip>
    {/if}
    {#if isRemoved}
        <Tooltip>
            {#snippet button()}
                <i class="fa-solid fa-ghost"></i>
            {/snippet}
            Утрачена
        </Tooltip>
    {/if}
</span>
