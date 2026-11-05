<script lang="ts">
    import {Input} from '$lib/components/ui/input';
    import EyeIcon from '@lucide/svelte/icons/eye';
    import EyeOffIcon from '@lucide/svelte/icons/eye-off';
    import type {HTMLInputAttributes} from 'svelte/elements';

    type Props = Omit<HTMLInputAttributes, 'type' | 'files'>;

    let {value = $bindable(), ...rest}: Props = $props();

    let isPlainPassword: boolean = $state(false);
</script>

<div class="relative">
    <Input type={isPlainPassword ? 'text' : 'password'} class="pr-12" bind:value {...rest} />
    <button
        type="button"
        class="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg transition-colors pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-11 pointer-coarse:after:-translate-1/2"
        onclick={e => {
            e.stopPropagation();
            isPlainPassword = !isPlainPassword;
        }}
        tabindex={-1}
        aria-label={isPlainPassword ? 'Скрыть пароль' : 'Показать пароль'}
    >
        {#if isPlainPassword}
            <EyeOffIcon />
        {:else}
            <EyeIcon />
        {/if}
    </button>
</div>
