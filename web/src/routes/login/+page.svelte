<script lang="ts">
    import {createMutation, useQueryClient} from '@tanstack/svelte-query';
    import type {LoginFormInputs, LoginResponsePayload} from '$lib/interfaces/auth';
    import {login} from '$lib/api/auth';
    import RefreshToken from '$lib/api/auth/refreshToken';
    import {page} from '$app/state';
    import {goto} from '$app/navigation';
    import {createForm} from 'felte';
    import RequestError from '$lib/errors/RequestError';
    import type {Payload} from '$lib/interfaces/api';
    import type {ChangePasswordFormErrors} from '$lib/interfaces/user';
    import { toast } from 'svelte-sonner';
    import * as zod from 'zod';
    import {validator} from '@felte/validator-zod';
    import {Button} from '$lib/components/ui/button';
    import Logo from './logo.svelte';
    import ErrorableLabel from '$lib/components/errorableLabel.svelte';
    import {Input} from '$lib/components/ui/input';
    import PasswordInput from '$lib/components/input/passwordInput.svelte';

    const queryClient = useQueryClient();

    const mutation = createMutation({
        mutationFn: login,
    });

    const schema = zod.object({
        email: zod.string().nonempty('Пожалуйста, введите email').email('Это непохоже на email'),
        password: zod.string().nonempty('Пожалуйста, введите пароль'),
    });

    const {form, errors, isSubmitting} = createForm<zod.infer<typeof schema>>({
        onSubmit: async (values: LoginFormInputs) => await $mutation.mutateAsync(values),
        onSuccess: async (result: unknown) => {
            RefreshToken.set((result as LoginResponsePayload).data.refreshToken);
            queryClient.clear();
            const ref = page.url.searchParams.get('ref');
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

<section class="flex h-screen flex-col items-center justify-center p-6">
    <Logo class="mb-10 flex w-full max-w-sm" />
    <form class="flex w-full max-w-sm flex-col gap-4" use:form>
        <div>
            <ErrorableLabel for="email" class="mb-1" error={$errors.email}>email</ErrorableLabel>
            <Input type="email" id="email" name="email" required />
        </div>
        <div>
            <ErrorableLabel for="password" class="mb-1" error={$errors.password}>
                пароль
            </ErrorableLabel>
            <PasswordInput id="password" name="password" required />
        </div>
        <div class="mt-2">
            <Button type="submit" class="text-base" disabled={$isSubmitting.valueOf()}>
                Войти
            </Button>
        </div>
    </form>
</section>
