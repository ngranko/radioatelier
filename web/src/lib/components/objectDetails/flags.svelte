<script lang="ts">
    import Tooltip from '$lib/components/tooltip.svelte';

    interface Props {
        isPublic: boolean;
        isVisited: boolean;
        isRemoved: boolean;
    }

    let {isPublic, isVisited, isRemoved}: Props = $props();
</script>

<span class="flags">
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

<style lang="scss">
    @use '../../../styles/colors';
    @use '../../../styles/typography';

    .flags {
        @include typography.size-20;
        position: absolute;
        top: 16px;
        right: 24px;
        display: flex;

        & > * {
            color: colors.$black;
        }

        & > :global(:not(:first-child)) {
            margin-left: 8px;
        }
    }
</style>
