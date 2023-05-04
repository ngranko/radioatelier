<script lang="ts">
    let innerWidth;

    $: rawIconWidth = innerWidth / 8;
    $: iconWidth = Math.max(Math.min(rawIconWidth, 80), 40);
</script>

<svelte:window bind:innerWidth />

<div class="links" style="--icon-width:{iconWidth}px">
    <a href="https://instagram.com/radio__atelier/" target="_blank">
        <img class="igIcon" src="/instagram_icon.svg" alt="instagram" />
    </a>
    <a href="https://t.me/radioatelier" target="_blank">
        <img class="tgIcon" src="/telegram_icon.svg" alt="telegram" />
    </a>
</div>

<style lang="scss">
    .links {
        display: flex;
        width: calc(var(--icon-width) * 4);
        justify-content: space-between;
        align-items: flex-start;
        margin-top: 64px;
        margin-bottom: 80px;
    }

    .igIcon {
        width: var(--icon-width);
        height: var(--icon-width);
        filter: invert(1);
    }

    .tgIcon {
        width: calc(var(--icon-width) * 1.05);
        height: calc(var(--icon-width) * 1.05);
        filter: invert(1);
    }
</style>
