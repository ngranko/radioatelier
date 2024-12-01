<script lang="ts">
    import Tooltip from '$lib/components/tooltip.svelte';

    interface Props {
        children?: import('svelte').Snippet;
    }

    let {children}: Props = $props();
</script>

<Tooltip class="importFieldTooltip">
    {#snippet button()}
        <i class="fa-regular fa-circle-question"></i>
    {/snippet}
    {@render children?.()}
</Tooltip>

<style lang="scss">
    @use '../../../../styles/colors';

    :global(.importFieldTooltip) {
        margin-top: 24px;
        margin-left: 16px;
    }

    i {
        color: colors.$darkgray;
    }
</style>
