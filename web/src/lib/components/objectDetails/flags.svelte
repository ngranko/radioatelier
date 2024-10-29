<script lang="ts">
    import Tooltip from '$lib/components/tooltip.svelte';

    export let isPublic: boolean;
    export let isVisited: boolean;
    export let isRemoved: boolean;
</script>

<span class="flags">
    {#if isPublic}
        <Tooltip>
            <i class="fa-solid fa-lock-open" slot="button"></i>
            Публичная
        </Tooltip>
    {:else}
        <Tooltip>
            <i class="fa-solid fa-lock" slot="button"></i>
            Приватная
        </Tooltip>
    {/if}
    {#if isVisited}
        <Tooltip>
            <i class="fa-solid fa-person-circle-check" slot="button"></i>
            Посещена
        </Tooltip>
    {/if}
    {#if isRemoved}
        <Tooltip>
            <i class="fa-solid fa-ghost" slot="button"></i>
            Утрачена
        </Tooltip>
    {/if}
</span>

<style lang="scss">
    @use '../../../styles/typography';

    .flags {
        @include typography.size-20;
        position: absolute;
        top: 16px;
        right: 24px;
        display: flex;

        & > :global(:not(:first-child)) {
            margin-left: 8px;
        }
    }
</style>
