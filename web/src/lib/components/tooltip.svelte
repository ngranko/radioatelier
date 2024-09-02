<script lang="ts">
    import {fade} from 'svelte/transition';
    import {cubicInOut} from 'svelte/easing';

    let isOpen = false;

    function handleClick() {
        isOpen = !isOpen;
        if (isOpen) {
            window.addEventListener('click', handleClick);
        } else {
            window.removeEventListener('click', handleClick);
        }
    }
</script>

<div class="container">
    <button class="button" on:click|stopPropagation={handleClick}>
        <i class="fa-regular fa-circle-question"></i>
    </button>
    {#if isOpen}
        <div class="tooltip" transition:fade={{duration: 200, easing: cubicInOut}}><slot /></div>
    {/if}
</div>

<style lang="scss">
    @use '../../styles/colors';
    @use '../../styles/typography';

    .container {
        position: relative;
        margin-left: 16px;
    }

    .button {
        @include typography.size-20;
        width: 26px;
        height: 26px;
        padding: 0;
        border: none;
        background: colors.$white;
        color: colors.$darkgray;
        text-align: center;
        cursor: pointer;
    }

    .tooltip {
        @include typography.size-14;
        position: absolute;
        left: -14px;
        top: 50%;
        width: max-content;
        max-width: 244px;
        padding: 16px;
        border: 1px solid colors.$gray;
        border-radius: 6px;
        background: colors.$white;
        text-align: start;
        transform: translate(-100%, -50%);

        &::before {
            content: '';
            display: block;
            position: absolute;
            right: -1px;
            top: 50%;
            width: 12px;
            height: 12px;
            border: 1px solid colors.$gray;
            border-bottom: none;
            border-left: none;
            border-top-right-radius: 4px;
            background: colors.$white;
            transform: translate(50%, -50%) rotate(45deg);
            transform-origin: center;
        }
    }
</style>
