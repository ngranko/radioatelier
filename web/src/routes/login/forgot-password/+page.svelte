<script lang="ts">
    import Logo from '../logo.svelte';
    import RequestForm from './requestForm.svelte';
    import ResetForm from './resetForm.svelte';

    let step = $state<'request' | 'reset'>('request');
    let requestedEmail = $state('');

    const currentTitle = $derived(step === 'request' ? 'Восстановление доступа' : 'Подтверждение');
</script>

<div class="mb-10 text-center">
    <Logo class="mb-4 flex items-center justify-center gap-3 text-3xl" />
    <p class="text-muted-foreground/70 text-sm tracking-wide">
        {currentTitle}
    </p>
</div>

{#if step === 'request'}
    <RequestForm bind:requestedEmail onSubmit={() => (step = 'reset')} />
{:else}
    <ResetForm bind:requestedEmail onBack={() => (step = 'request')} />
{/if}
