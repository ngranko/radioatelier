<script lang="ts">
    import type {HTMLButtonAttributes} from 'svelte/elements';
    import {clsx} from 'clsx';

    export let type: HTMLButtonAttributes['type'] = undefined;
    export let disabled: boolean = false;
    export let icon: string;
    export let modifier: 'primary' | 'secondary' | 'danger' | undefined;

    const className = clsx({
        button: true,
        primary: modifier === 'primary',
        secondary: modifier === 'secondary',
        danger: modifier === 'danger',
        [$$props.class]: $$props.class,
    });
</script>

<button {type} {disabled} class={className} on:click>
    <i class={icon}></i>
</button>

<style lang="scss">
    @use 'sass:color';
    @use '../../../styles/colors';
    @use '../../../styles/typography';

    .button {
        @include typography.size-22;
        width: 40px;
        height: 40px;
        margin: 0;
        padding: 0;
        border: none;
        border-radius: 50%;
        background-color: colors.$lightgray;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: background-color 0.2s ease-in-out;
        cursor: pointer;

        &:hover {
            background-color: color.scale(colors.$lightgray, $lightness: -16%);
        }
    }

    .primary {
        color: colors.$primary;
    }

    .secondary {
        color: colors.$secondary;
    }

    .danger {
        color: colors.$danger;
    }
</style>
