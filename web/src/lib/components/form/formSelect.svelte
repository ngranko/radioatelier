<script lang="ts">
    import {clsx} from 'clsx';
    import Svelecte from 'svelecte';

    interface Option {
        value: string | number | null;
        text: string;
    }

    interface Props {
        id?: string | undefined;
        name?: string | undefined;
        value?: string | number | null | undefined;
        options?: Option[];
        placeholder?: string | undefined;
        required?: boolean;
        label?: string;
        error?: string[] | null;
        onChange?(value: unknown): void;
    }

    let {
        id = undefined,
        name = undefined,
        value = $bindable(),
        options = [],
        placeholder = undefined,
        required = false,
        label = undefined,
        error = undefined,
        onChange,
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
    <Svelecte
        {onChange}
        inputId={id}
        {name}
        bind:value
        {options}
        {required}
        {placeholder}
        clearable={!required}
        highlightFirstItem={false}
    />
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

    :global(.svelecte.svelecte-control .sv-control) {
        --sv-min-height: 38px;
        border-color: colors.$gray;
    }

    .error {
        & label {
            color: colors.$danger;
        }

        :global(.svelecte.svelecte-control .sv-control) {
            border-color: colors.$danger;
        }
    }

    .label {
        @include typography.size-14;
        margin-bottom: 4px;
        transition: color 0.2s;
    }
</style>
