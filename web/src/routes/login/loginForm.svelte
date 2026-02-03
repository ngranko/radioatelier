<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import {Label} from '$lib/components/ui/label';
    import {Input} from '$lib/components/ui/input';
    import PasswordInput from '$lib/components/input/passwordInput.svelte';
    import LoadingDots from './loadingDots.svelte';

    interface Props {
        email: string;
        password: string;
        submitting: boolean;
        errors: {email?: string; password?: string};
        onsubmit: (event: SubmitEvent) => void;
    }

    let {
        email = $bindable(),
        password = $bindable(),
        submitting,
        errors,
        onsubmit,
    }: Props = $props();
</script>

<form {onsubmit} class="flex flex-col gap-5">
    <div class="space-y-2">
        <Label for="email">Email</Label>
        <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            class="focus-visible:border-primary focus-visible:ring-primary/30"
            bind:value={email}
        />
        {#if errors.email}
            <p class="text-destructive text-sm">{errors.email}</p>
        {/if}
    </div>
    <div class="space-y-2">
        <Label for="password">Пароль</Label>
        <PasswordInput
            id="password"
            placeholder="••••••••"
            class="focus-visible:border-primary focus-visible:ring-primary/30"
            bind:value={password}
        />
        {#if errors.password}
            <p class="text-destructive text-sm">{errors.password}</p>
        {/if}
    </div>
    <div class="mt-2">
        <Button type="submit" class="w-full text-base" disabled={submitting}>
            {#if submitting}
                <LoadingDots />
            {:else}
                Войти
            {/if}
        </Button>
    </div>
</form>
