<script>
    import Tooltip from '$lib/components/tooltip.svelte';
</script>

<Tooltip class="importFieldTooltip">
    <i class="fa-regular fa-circle-question" slot="button"></i>
    <slot />
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
