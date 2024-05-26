<script lang="ts">
    import {createMutation} from '@tanstack/svelte-query';
    import type {LoginFormInputs} from '$lib/interfaces/auth';
    import {login} from '$lib/api/auth';
    import RefreshToken from '$lib/api/auth/refreshToken';
    import {page} from '$app/stores';
    import {goto} from '$app/navigation';

    const mutation = createMutation({
        mutationFn: login,
    });

    $: console.log('submitted at', $mutation.submittedAt);
    $: console.log('is pending', $mutation.isPending);
    $: console.log('is success', $mutation.isSuccess);
    $: console.log('is error', $mutation.isError);

    async function handleSubmit(event: SubmitEvent) {
        const formData = new FormData(event.currentTarget as HTMLFormElement);
        const values: LoginFormInputs = Object.fromEntries(formData) as unknown as LoginFormInputs;
        console.log(values);

        try {
            const result = await $mutation.mutateAsync(values);
            RefreshToken.set(result.data.refreshToken);
        } catch (error) {
            console.error($mutation.error);
            return;
        }

        const ref = $page.url.searchParams.get('ref');
        await goto(ref ?? '/');
    }
</script>

<h1>Login page</h1>

<form method="POST" on:submit|preventDefault|stopPropagation={handleSubmit}>
    <input type="email" name="email" placeholder="email" required />
    <input type="password" name="password" placeholder="пароль" required />
    <button>Войти</button>
</form>

<style lang="scss">
    button {
        background: none;
    }
</style>
