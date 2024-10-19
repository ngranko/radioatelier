<script lang="ts">
    import {clsx} from 'clsx';
    import Svelecte from 'svelecte';

    interface Option {
        value: string | number | null;
        text: string;
    }

    export let id: string | undefined = undefined;
    export let name: string | undefined = undefined;
    export let value: string | number | null | undefined = '';
    export let options: Option[] = [];
    export let placeholder: string | undefined = undefined;
    export let required = false;
    export let label: string | undefined = undefined;
    export let error: string[] | null | undefined = undefined;

    let classes: string;
    let isError: boolean;

    $: isError = Boolean(error);
    $: classes = clsx({
        field: true,
        error: isError,
    });
</script>

<div class={classes}>
    <label for={id} class="label">{error ? error[0] : label}</label>
    <Svelecte
        on:change
        inputId={id}
        {name}
        {value}
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
