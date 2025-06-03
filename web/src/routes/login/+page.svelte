<script lang="ts">
    import {createMutation, useQueryClient} from '@tanstack/svelte-query';
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
    import toast from 'svelte-5-french-toast';
    import * as yup from 'yup';
    import {validator} from '@felte/validator-yup';

    const queryClient = useQueryClient();

    const mutation = createMutation({
        mutationFn: login,
    });

    const schema = yup.object({
        email: yup.string().required('Пожалуйста, введите email'),
        password: yup.string().required('Пожалуйста, повторите пароль'),
    });

    const {form, errors, isSubmitting} = createForm<yup.InferType<typeof schema>>({
        onSubmit: async (values: LoginFormInputs) => await $mutation.mutateAsync(values),
        onSuccess: async (result: unknown) => {
            RefreshToken.set((result as LoginResponsePayload).data.refreshToken);
            queryClient.clear();
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

<section class="h-screen p-6 flex flex-col items-center justify-center">
    <div class="flex gap-3 text-3xl w-full max-w-sm mb-10">
        <img src="/logo.svg" class="h-8" alt="logo" />
        <span class="separator">.</span>
        <span class="name">архив</span>
    </div>
    <form class="w-full max-w-sm flex flex-col gap-4" use:form>
        <FormInput id="email" name="email" required label="email" error={$errors.email} />
        <FormPasswordInput
            id="password"
            name="password"
            required
            label="пароль"
            error={$errors.password}
        />
        <div class="mt-2">
            <PrimaryButton disabled={$isSubmitting.valueOf()}>Войти</PrimaryButton>
        </div>
    </form>
</section>
