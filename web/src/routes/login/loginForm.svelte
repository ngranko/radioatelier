<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import {Label} from '$lib/components/ui/label';
    import {Input} from '$lib/components/ui/input';
    import PasswordInput from '$lib/components/input/passwordInput.svelte';
    import {getErrorArray} from '$lib/utils/formErrors';
    import {defaults, superForm} from 'sveltekit-superforms';
    import LoadingDots from './loadingDots.svelte';
    import {loginSchema} from './schema';
    import {toast} from 'svelte-sonner';
    import {normalizeRef} from '$lib/utils';
    import {page} from '$app/state';
    import {goto} from '$app/navigation';
    import {zod4, zod4Client} from 'sveltekit-superforms/adapters';
    import {useQueryClient} from '@tanstack/svelte-query';
    import {useClerkContext} from 'svelte-clerk';
    import type {EmailCodeFactor} from '@clerk/types';

    interface Props {
        onNeedsSecondFactor: () => void;
        onForgotPassword: () => void;
    }

    const queryClient = useQueryClient();
    const ctx = useClerkContext();

    let {onNeedsSecondFactor, onForgotPassword}: Props = $props();

    async function handlePostSignInRedirect() {
        const ref = normalizeRef(page.url.searchParams.get('ref'));
        if (ctx.clerk?.session?.currentTask?.key === 'reset-password') {
            await goto(`/login/reset-password?ref=${encodeURIComponent(ref)}`);
            return;
        }
        await goto(ref);
    }

    const loginForm = superForm(defaults(zod4(loginSchema)), {
        SPA: true,
        validators: zod4Client(loginSchema),
        onSubmit: async () => {
            const validation = await loginForm.validateForm({update: true});
            if (!validation.valid) {
                return;
            }

            if (!ctx.clerk || !ctx.isLoaded || !ctx.clerk.client) {
                console.error(
                    'failed loading clerk for auth',
                    ctx.clerk,
                    ctx.isLoaded,
                    ctx.clerk?.client,
                );
                toast.error('Что-то пошло не так, попробуйте позже');
                return;
            }

            try {
                const signInAttempt = await ctx.clerk.client.signIn.create({
                    identifier: validation.data.email,
                    password: validation.data.password,
                });

                if (signInAttempt.status === 'complete') {
                    await ctx.clerk.setActive({session: signInAttempt.createdSessionId});
                    queryClient.clear();
                    await handlePostSignInRedirect();
                } else if (signInAttempt.status === 'needs_second_factor') {
                    const emailCodeFactor = signInAttempt.supportedSecondFactors?.find(
                        (factor): factor is EmailCodeFactor => factor.strategy === 'email_code',
                    );

                    if (emailCodeFactor) {
                        await ctx.clerk.client.signIn.prepareSecondFactor({
                            strategy: 'email_code',
                            emailAddressId: emailCodeFactor.emailAddressId,
                        });
                        onNeedsSecondFactor();
                    } else {
                        toast.error('Требуется дополнительная верификация');
                    }
                } else {
                    toast.error('Не удалось завершить вход');
                }
            } catch (err: unknown) {
                const clerkError = err as {errors?: Array<{code: string; message: string}>};
                const firstError = clerkError.errors?.[0];
                if (firstError?.code === 'form_password_compromised') {
                    toast.error(firstError.message);
                    onForgotPassword();
                    return;
                }
                const errorMessage = firstError?.message || 'Неверный email или пароль';
                toast.error(errorMessage);
            }
        },
    });

    let {form: formData, errors, enhance, submitting} = loginForm;
</script>

<form class="flex flex-col gap-5" use:enhance>
    <div class="space-y-2">
        <Label for="email">Email</Label>
        <Input
            id="email"
            name="email"
            type="email"
            placeholder="name@example.com"
            class="focus-visible:border-primary focus-visible:ring-primary/30"
            bind:value={$formData.email}
        />
        {#if $errors.email}
            <p class="text-destructive text-sm">
                {getErrorArray($errors.email)?.[0] ?? 'Это непохоже на email'}
            </p>
        {/if}
    </div>
    <div class="space-y-2">
        <Label for="password">Пароль</Label>
        <PasswordInput
            id="password"
            name="password"
            placeholder="••••••••"
            class="focus-visible:border-primary focus-visible:ring-primary/30"
            bind:value={$formData.password}
        />
        {#if $errors.password}
            <p class="text-destructive text-sm">
                {getErrorArray($errors.password)?.[0] ?? 'Пожалуйста, введите пароль'}
            </p>
        {/if}
        <Button
            type="button"
            variant="ghost"
            class="text-primary h-auto p-0 text-sm hover:bg-transparent"
            onclick={onForgotPassword}
        >
            Забыли пароль?
        </Button>
    </div>
    <div class="mt-2">
        <Button type="submit" class="w-full text-base" disabled={$submitting}>
            {#if $submitting}
                <LoadingDots />
            {:else}
                Войти
            {/if}
        </Button>
    </div>
</form>
