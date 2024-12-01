<script lang="ts">
    import Input from '$lib/components/input/input.svelte';
    import {clsx} from 'clsx';
    import {type Component, onMount} from 'svelte';

    interface Props {
        id?: string | undefined;
        name?: string | undefined;
        value?: string;
        placeholder?: string | undefined;
        required?: boolean;
        label?: string | undefined;
        error?: string[] | null | undefined;
        withStrengthIndicator?: boolean;
    }

    let {
        id = undefined,
        name = undefined,
        value = '',
        placeholder = undefined,
        required = false,
        label = undefined,
        error = undefined,
        withStrengthIndicator = false,
    }: Props = $props();

    let isPlainPassword: boolean = $state(false);
    let PasswordStrength: Component | undefined = $state();

    onMount(async () => {
        if (withStrengthIndicator) {
            const {default: Component} = await import('$lib/components/passwordStrength.svelte');
            PasswordStrength = Component;
        }
    });

    let isError: boolean = $derived(Boolean(error));
    let classes: string = $derived(
        clsx({
            field: true,
            error: isError,
        }),
    );

    function handleShowPasswordClick(event: MouseEvent) {
        event.stopPropagation();
        isPlainPassword = !isPlainPassword;
    }
</script>

<div class={classes}>
    <label for={id} class="label">{error ? error[0] : label}</label>
    <div class="inputContainer">
        <Input
            {id}
            type={isPlainPassword ? 'text' : 'password'}
            {name}
            {value}
            {required}
            {placeholder}
        />
        <button type="button" class="showPassword" onclick={handleShowPasswordClick}>
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
</style>
