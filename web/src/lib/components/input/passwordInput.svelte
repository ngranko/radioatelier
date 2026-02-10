<script lang="ts">
    import {Input} from '$lib/components/ui/input';
    import {Button} from '$lib/components/ui/button';
    import type {HTMLInputAttributes} from 'svelte/elements';

    interface Props extends Omit<HTMLInputAttributes, 'type' | 'files'> {}

    let {value = $bindable(), ...rest}: Props = $props();

    let isPlainPassword: boolean = $state(false);

    function handleShowPasswordClick(event: MouseEvent) {
        event.stopPropagation();
        isPlainPassword = !isPlainPassword;
    }
</script>

<div class="relative">
    <Input type={isPlainPassword ? 'text' : 'password'} class="pr-11" bind:value {...rest} />
    <Button
        variant="ghost"
        class="absolute top-1/2 right-0 w-10 transform-[translateY(-50%)] text-xl"
        onclick={handleShowPasswordClick}
    >
        {#if isPlainPassword}
            <i class="fa-regular fa-eye-slash"></i>
        {:else}
            <i class="fa-regular fa-eye"></i>
        {/if}
    </Button>
</div>
