<script lang="ts">
    import { stopPropagation } from 'svelte/legacy';

    import {fade} from 'svelte/transition';
    import {cubicInOut} from 'svelte/easing';
    interface Props {
        button?: import('svelte').Snippet;
        children?: import('svelte').Snippet;
        [key: string]: any
    }

    let { ...props }: Props = $props();

    let isOpen = $state(false);

    function handleClick() {
        isOpen = !isOpen;
        if (isOpen) {
            window.addEventListener('click', handleClick);
        } else {
            window.removeEventListener('click', handleClick);
        }
    }
</script>

<div class={`container ${props.class ?? ''}`}>
    <button type="button" class="button" onclick={stopPropagation(handleClick)}>
        {@render props.button?.()}
    </button>
    {#if isOpen}
        <div class="tooltip" transition:fade={{duration: 200, easing: cubicInOut}}>{@render props.children?.()}</div>
    {/if}
</div>

<style lang="scss">
    @use '../../styles/colors';
    @use '../../styles/typography';

    .container {
        position: relative;
    }

    .button {
        @include typography.size-20;
        width: 26px;
        height: 26px;
        padding: 0;
        border: none;
        background: none;
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
        padding: 8px 12px;
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
