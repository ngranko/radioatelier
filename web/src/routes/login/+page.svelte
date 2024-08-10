<script lang="ts">
    import {createMutation} from '@tanstack/svelte-query';
    import type {LoginFormInputs} from '$lib/interfaces/auth';
    import {login} from '$lib/api/auth';
    import RefreshToken from '$lib/api/auth/refreshToken';
    import {page} from '$app/stores';
    import {goto} from '$app/navigation';
    import Input from '$lib/components/input/input.svelte';
    import PrimaryButton from '$lib/components/button/primaryButton.svelte';

    const mutation = createMutation({
        mutationFn: login,
    });

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

<section class="login-page">
    <div class="title">
        <img src="/logo.svg" class="logo" alt="logo" />
        <span class="separator">.</span>
        <span class="name">архив</span>
    </div>
    <form method="POST" class="form" on:submit|preventDefault|stopPropagation={handleSubmit}>
        <div class="field">
            <label for="email" class="label">email</label>
            <Input id="email" type="email" name="email" required />
        </div>
        <div class="field">
            <label for="password" class="label">пароль</label>
            <Input id="password" type="password" name="password" required />
        </div>
        <div class="actions">
            <PrimaryButton>Войти</PrimaryButton>
        </div>
    </form>
</section>

<style lang="scss">
    @use '../../styles/typography';

    .login-page {
        height: 100dvh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    .title {
        @include typography.size-32;
        width: 100%;
        max-width: 400px;
        margin-bottom: 40px;
    }

    .logo {
        height: 32px;
    }

    .form {
        width: 100%;
        max-width: 400px;
        display: flex;
        flex-direction: column;
    }

    .field {
        margin-bottom: 16px;
        display: flex;
        flex-direction: column;
        align-items: stretch;
    }

    .label {
        @include typography.size-14;
        margin-bottom: 4px;
    }
</style>
