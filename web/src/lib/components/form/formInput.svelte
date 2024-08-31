<script lang="ts">
    import Input from '$lib/components/input/input.svelte';
    import {clsx} from 'clsx';
    import {cubicInOut} from 'svelte/easing';
    import {fade} from 'svelte/transition';

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
    {#if label}<label for={id} class="label">{label}</label>{/if}
    <Input {id} {type} {name} {value} {required} {placeholder} />
    {#if error}
        <span class="errorMessage" transition:fade={{duration: 200, easing: cubicInOut}}>
            {error[0]}
        </span>
    {/if}
</div>

<style lang="scss">
    @use '../../../styles/colors';
    @use '../../../styles/typography';

    .field {
        position: relative;
        margin-bottom: 24px;
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

    .errorMessage {
        @include typography.size-14;
        position: absolute;
        bottom: 0;
        left: 0;
        transform: translateY(100%);
        color: colors.$danger;
    }
</style>
