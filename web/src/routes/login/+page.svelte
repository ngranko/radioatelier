<script lang="ts">
    import {createMutation} from '@tanstack/svelte-query';
    import type {LoginFormInputs, LoginResponsePayload} from '$lib/interfaces/auth';
    import {login} from '$lib/api/auth';
    import RefreshToken from '$lib/api/auth/refreshToken';
    import {page} from '$app/stores';
    import {goto} from '$app/navigation';
    import PrimaryButton from '$lib/components/button/primaryButton.svelte';
    import FormInput from '$lib/components/form/formInput.svelte';
    import FormPasswordInput from '$lib/components/form/formPasswordInput.svelte';
    import {createForm} from 'felte';
    import RequestError from '$lib/errors/RequestError';
    import type {Payload} from '$lib/interfaces/api';
    import type {ChangePasswordFormErrors} from '$lib/interfaces/user';
    import toast from 'svelte-french-toast';
    import * as yup from 'yup';
    import {validator} from '@felte/validator-yup';

    const mutation = createMutation({
        mutationFn: login,
    });

    const schema = yup.object({
        email: yup.string().required('Пожалуйста, введите email'),
        password: yup.string().required('Пожалуйста, повторите пароль'),
    });

    const {form, errors, isSubmitting} = createForm<yup.InferType<typeof schema>>({
        onSubmit: async (values: LoginFormInputs) => await $mutation.mutateAsync(values),
        onSuccess: async result => {
            RefreshToken.set((result as LoginResponsePayload).data.refreshToken);
            const ref = $page.url.searchParams.get('ref');
            await goto(ref ?? '/');
        },
        onError: error => {
            console.error(error);
            if (error instanceof RequestError && (error.payload as Payload).errors) {
                return (error.payload as Payload<null, ChangePasswordFormErrors>).errors;
            }
            toast.error('Вход не удался');
        },
        extend: validator({schema}),
    });
</script>

<section class="login-page">
    <div class="title">
        <img src="/logo.svg" class="logo" alt="logo" />
        <span class="separator">.</span>
        <span class="name">архив</span>
    </div>
    <form class="form" use:form>
        <FormInput id="email" name="email" required label="email" error={$errors.email} />
        <FormPasswordInput
            id="password"
            name="password"
            required
            label="пароль"
            error={$errors.password}
        />
        <div class="actions">
            <PrimaryButton disabled={$isSubmitting.valueOf()}>Войти</PrimaryButton>
        </div>
    </form>
</section>

<style lang="scss">
    @use '../../styles/typography';

    .login-page {
        height: 100dvh;
        padding: 24px;
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
        gap: 16px;
    }

    .actions {
        margin-top: 8px;
    }
</style>
