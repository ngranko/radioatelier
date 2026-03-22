<script lang="ts">
    import {Input} from '$lib/components/ui/input';
    import type {HTMLInputAttributes} from 'svelte/elements';
    import EyeIcon from '@lucide/svelte/icons/eye';
    import EyeOffIcon from '@lucide/svelte/icons/eye-off';

    type Props = Omit<HTMLInputAttributes, 'type' | 'files'>;

    let {value = $bindable(), ...rest}: Props = $props();

    let isPlainPassword: boolean = $state(false);
</script>

<div class="relative">
    <Input type={isPlainPassword ? 'text' : 'password'} class="pr-12" bind:value {...rest} />
    <button
        type="button"
        class="text-muted-foreground/60 hover:text-foreground/80 absolute top-1/2 right-3 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg transition-colors"
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
