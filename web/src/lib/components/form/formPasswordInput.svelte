<script lang="ts">
    import Input from '$lib/components/input/input.svelte';
    import {clsx} from 'clsx';
    import {cubicInOut} from 'svelte/easing';
    import {fade} from 'svelte/transition';
    import {type ComponentType, onMount} from 'svelte';

    export let id: string | undefined = undefined;
    export let name: string | undefined = undefined;
    export let value: string = '';
    export let placeholder: string | undefined = undefined;
    export let required = false;
    export let label: string | undefined = undefined;
    export let error: boolean = false;
    export let errorMessage: string | undefined = undefined;
    export let withStrengthIndicator: boolean = false;

    let isPlainPassword: boolean = false;
    let PasswordStrength: ComponentType;

    onMount(async () => {
        if (withStrengthIndicator) {
            const {default: Component} = await import('$lib/components/passwordStrength.svelte');
            PasswordStrength = Component;
        }
    });

    let classes: string;

    $: classes = clsx({
        field: true,
        error: error,
    });

    function handleShowPasswordClick() {
        isPlainPassword = !isPlainPassword;
    }
</script>

<div class={classes}>
    {#if label}<label for={id} class="label">{label}</label>{/if}
    <div class="inputContainer">
        <Input
            {id}
            type={isPlainPassword ? 'text' : 'password'}
            {name}
            {value}
            {required}
            {placeholder}
        />
        <button type="button" class="showPassword" on:click={handleShowPasswordClick}>
            {#if isPlainPassword}
                <i class="fa-regular fa-eye-slash"></i>
            {:else}
                <i class="fa-regular fa-eye"></i>
            {/if}
        </button>
    </div>
    {#if withStrengthIndicator && PasswordStrength}
        <PasswordStrength {value} />
    {/if}
    {#if error}
        <span class="errorMessage" transition:fade={{duration: 200, easing: cubicInOut}}>
            {errorMessage}
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

    .inputContainer {
        position: relative;

        & :global(input) {
            width: 100%;
        }
    }

    .showPassword {
        @include typography.size-20;
        position: absolute;
        top: 50%;
        right: 0;
        width: 41px;
        margin: 0;
        padding: 8px;
        background: none;
        border: none;
        transform: translateY(-50%);
        cursor: pointer;
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
