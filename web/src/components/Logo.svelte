<script>
    import LogoLight from './LogoLight.svelte';
    import LogoDark from './LogoDark.svelte';
    import {defaultHeight, defaultWidth} from '../models/logo.ts';
</script>

<div class="logo" style="--default-width:{defaultWidth}px;--default-height:{defaultHeight}px;">
    <LogoDark />
    <LogoLight />
</div>

<style lang="scss">
    .logo {
        width: min(var(--default-width), 90vw);
        height: calc(min(var(--default-width), 90vw) * 0.3666);
        margin-top: 80px;
        position: relative;
    }
</style>
