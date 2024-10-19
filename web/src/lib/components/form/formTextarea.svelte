<script lang="ts">
    import Textarea from '$lib/components/input/textarea.svelte';
    import {clsx} from 'clsx';

    export let id: string | undefined = undefined;
    export let name: string | undefined = undefined;
    export let type: 'text' | 'email' | 'password' = 'text';
    export let value: string = '';
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
    <Textarea {id} {type} {name} {value} {required} {placeholder} />
</div>

<style lang="scss">
    @use '../../../styles/colors';
    @use '../../../styles/typography';

    .field {
        position: relative;
        //margin-bottom: 8px;
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
