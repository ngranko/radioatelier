<script lang="ts">
    import {Input} from '$lib/components/ui/input';
    import type {HTMLInputAttributes} from 'svelte/elements';

    interface Props extends Omit<HTMLInputAttributes, 'type' | 'files'> {}

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
    >
        {#if isPlainPassword}
            <i class="fa-regular fa-eye-slash text-lg"></i>
        {:else}
            <i class="fa-regular fa-eye text-lg"></i>
        {/if}
    </button>
</div>
