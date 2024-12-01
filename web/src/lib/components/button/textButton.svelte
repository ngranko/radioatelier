<script lang="ts">
    import type {HTMLButtonAttributes} from 'svelte/elements';
    import {clsx} from 'clsx';

    interface Props {
        type?: HTMLButtonAttributes['type'];
        disabled?: boolean;
        modifier?: 'primary' | 'secondary' | 'danger';
        children?: import('svelte').Snippet;
        onClick?(event: MouseEvent): void;
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
        border: none;
        background: none;
        font-size: 16px;
        transition: background-color 0.2s ease-in-out;
        cursor: pointer;

        &:disabled {
            color: colors.$gray;
            cursor: default;

            &:hover {
                color: colors.$gray;
            }
        }
    }

    .primary {
        color: colors.$primary;

        &:hover {
            color: color.scale(colors.$primary, $lightness: +16%);
        }
    }

    .secondary {
        color: colors.$secondary;

        &:hover {
            color: color.scale(colors.$secondary, $lightness: +16%);
        }
    }

    .danger {
        color: colors.$danger;

        &:hover {
            color: color.scale(colors.$danger, $lightness: +16%);
        }
    }
</style>
