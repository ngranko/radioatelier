<script lang="ts">
    import {fade} from 'svelte/transition';
    import {cubicInOut} from 'svelte/easing';

    let {onClick} = $props();
</script>

<button
    class="clear-button"
    aria-label="Очистить"
    onclick={onClick}
    transition:fade={{duration: 200, easing: cubicInOut}}
>
    <i class="icon fa-solid fa-xmark"></i>
</button>

<style lang="scss">
    @use '../../../styles/colors';
    @use '../../../styles/typography';

    .clear-button {
        @include typography.size-20;
        position: absolute;
        right: 0;
        top: 50%;
        margin-right: 6px;
        padding: 8px;
        border: 0;
        transform: translateY(-50%);
        background: none;
        cursor: pointer;
    }

    .icon {
        display: block;
        width: 20px;
    }
</style>
