<script lang="ts">
    import Menu from '$lib/components/userMenu/menu.svelte';

    let isOpen = false;

    function handleMenuClick() {
        isOpen = !isOpen;
    }
</script>

<div class="user">
    <button class="userButton" on:click={handleMenuClick}>
        <i class="fa-solid fa-user-ninja"></i>
    </button>
    {#if isOpen}
        <Menu on:close={handleMenuClick} />
    {/if}
</div>

<style lang="scss">
    @use 'sass:color';
    @use '../../../styles/colors';
    @use '../../../styles/typography';

    .user {
        position: absolute;
        top: 0;
        right: 0;
        margin: 16px;
        z-index: 1;
    }

    .userButton {
        width: 40px;
        height: 40px;
        background: color.scale(colors.$primary, $lightness: +70%);
        border: none;
        border-radius: 50%;
        padding: 0;
        font-size: 30px;
        display: flex;
        justify-content: center;
        align-items: flex-end;
        overflow: hidden;
        cursor: pointer;
        color: colors.$black;
        transition: background-color 0.2s;

        &:hover {
            background-color: color.scale(colors.$primary, $lightness: +60%);
        }
    }
</style>
