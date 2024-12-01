<script lang="ts">
    import type {Snippet} from 'svelte';
    import type {HTMLButtonAttributes} from 'svelte/elements';
    import {clsx} from 'clsx';

    interface Props {
        type?: HTMLButtonAttributes['type'];
        disabled?: boolean;
        modifier?: 'primary' | 'secondary' | 'danger';
        children?: Snippet;
        onClick?(): void;
    }

    let {
        type = undefined,
        disabled = false,
        modifier = 'primary',
        children,
        onClick,
    }: Props = $props();

    const className = clsx({
        button: true,
        primary: modifier === 'primary',
        secondary: modifier === 'secondary',
        danger: modifier === 'danger',
    });
</script>

<button {type} {disabled} class={className} onclick={onClick}>{@render children?.()}</button>

<style lang="scss">
    @use 'sass:color';
    @use '../../../styles/colors';
    @use '../../../styles/typography';

    .button {
        @include typography.brand-face;
        min-width: 80px;
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        transition: background-color 0.2s ease-in-out;
        cursor: pointer;

        &:disabled {
            background-color: colors.$gray;
            cursor: default;

            &:hover {
                background-color: colors.$gray;
            }
        }
    }

    .primary {
        background-color: colors.$primary;
        color: colors.$white;

        &:hover {
            background-color: color.scale(colors.$primary, $lightness: +16%);
        }
    }

    .secondary {
        background-color: colors.$secondary;
        color: colors.$black;

        &:hover {
            background-color: color.scale(colors.$secondary, $lightness: +16%);
        }
    }

    .danger {
        background-color: colors.$danger;
        color: colors.$white;

        &:hover {
            background-color: color.scale(colors.$danger, $lightness: +16%);
        }
    }
</style>
