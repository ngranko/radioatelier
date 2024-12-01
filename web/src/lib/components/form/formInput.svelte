<script lang="ts">
    import Input from '$lib/components/input/input.svelte';
    import {clsx} from 'clsx';

    interface Props {
        id?: string | undefined;
        name?: string | undefined;
        type?: 'text' | 'email' | 'password';
        value?: string;
        placeholder?: string | undefined;
        required?: boolean;
        label?: string | undefined;
        error?: string[] | null | undefined;
    }

    let {
        id = undefined,
        name = undefined,
        type = 'text',
        value = '',
        placeholder = undefined,
        required = false,
        label = undefined,
        error = undefined,
    }: Props = $props();

    let isError: boolean = $derived(Boolean(error));
    let classes: string = $derived(
        clsx({
            field: true,
            error: isError,
        }),
    );
</script>

<div class={classes}>
    <label for={id} class="label">{error ? error[0] : label}</label>
    <Input {id} {type} {name} {value} {required} {placeholder} />
</div>

<style lang="scss">
    @use '../../../styles/colors';
    @use '../../../styles/typography';

    .field {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: stretch;
    }

    .error {
        & label {
            color: colors.$danger;
        }

        & :global(input) {
            border-color: colors.$danger;
        }
    }

    .label {
        @include typography.size-14;
        margin-bottom: 4px;
        transition: color 0.2s;
    }
</style>
