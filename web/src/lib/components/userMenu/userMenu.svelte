<script lang="ts">
    import Menu from '$lib/components/userMenu/menu.svelte';

    let isOpen = $state(false);

    function handleMenuClick() {
        isOpen = !isOpen;
    }
</script>

<div>
    <button class="userButton" onclick={handleMenuClick} aria-label="Показать меню">
        <i class="fa-solid fa-user-ninja"></i>
    </button>
    {#if isOpen}
        <Menu onClose={handleMenuClick} />
    {/if}
</div>

<style lang="scss">
    @use 'sass:color';
    @use '../../../styles/colors';
    @use '../../../styles/typography';

    .userButton {
        position: relative;
        width: 40px;
        height: 40px;
        background: color.scale(colors.$primary, $lightness: +70%);
        border: none;
        border-radius: 50%;
        margin: 8px;
        padding: 0;
        font-size: 30px;
        display: flex;
        justify-content: center;
        align-items: flex-end;
        overflow: hidden;
        cursor: pointer;
        color: colors.$black;
        transition: background-color 0.2s;
        z-index: 2;

        &:hover {
            background-color: color.scale(colors.$primary, $lightness: +60%);
        }
    }
</style>
