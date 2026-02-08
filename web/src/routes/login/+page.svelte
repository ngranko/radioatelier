<script lang="ts">
    import {goto} from '$app/navigation';
    import {page} from '$app/state';
    import {useQueryClient} from '@tanstack/svelte-query';
    import {toast} from 'svelte-sonner';
    import {useClerkContext} from 'svelte-clerk';
    import type {EmailCodeFactor} from '@clerk/types';
    import Logo from './logo.svelte';
    import Background from './background.svelte';
    import LoginForm from './loginForm.svelte';
    import SecondFactorForm from './secondFactorForm.svelte';
    import SsoButtons from './ssoButtons.svelte';
    import { normalizeRef } from '$lib/utils';

    const queryClient = useQueryClient();
    const ctx = useClerkContext();

    let email = $state('');
    let password = $state('');
    let verificationCode = $state('');
    let submitting = $state(false);
    let needsSecondFactor = $state(false);
    let errors = $state<{email?: string; password?: string; code?: string}>({});

    async function handleSubmit(event: SubmitEvent) {
        event.preventDefault();
        errors = {};

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim() || !emailRegex.test(email)) {
            errors.email = 'Это непохоже на email';
            return;
        }
        if (!password) {
            errors.password = 'Пожалуйста, введите пароль';
            return;
        }

        if (!ctx.clerk || !ctx.isLoaded || !ctx.clerk.client) {
            console.error('failed loading clerk for auth', ctx.clerk, ctx.isLoaded, ctx.clerk?.client);
            toast.error('Что-то пошло не так, попробуйте позже');
            return;
        }

        submitting = true;

        try {
            const signInAttempt = await ctx.clerk.client.signIn.create({
                identifier: email,
                password,
            });

            if (signInAttempt.status === 'complete') {
                await ctx.clerk.setActive({session: signInAttempt.createdSessionId});
                queryClient.clear();
                goto(normalizeRef(page.url.searchParams.get('ref')));
            } else if (signInAttempt.status === 'needs_second_factor') {
                const emailCodeFactor = signInAttempt.supportedSecondFactors?.find(
                    (factor): factor is EmailCodeFactor => factor.strategy === 'email_code',
                );

                if (emailCodeFactor) {
                    await ctx.clerk.client.signIn.prepareSecondFactor({
                        strategy: 'email_code',
                        emailAddressId: emailCodeFactor.emailAddressId,
                    });
                    needsSecondFactor = true;
                } else {
                    toast.error('Требуется дополнительная верификация');
                }
            } else {
                toast.error('Не удалось завершить вход');
            }
        } catch (err: unknown) {
            const clerkError = err as {errors?: Array<{code: string; message: string}>};
            const errorMessage = clerkError.errors?.[0]?.message || 'Неверный email или пароль';
            toast.error(errorMessage);
        } finally {
            submitting = false;
        }
    }

    async function handleVerifyCode(event: SubmitEvent) {
        event.preventDefault();
        errors = {};

        if (!verificationCode.trim()) {
            errors.code = 'Введите код подтверждения';
            return;
        }

        if (!ctx.clerk || !ctx.isLoaded || !ctx.clerk.client) {
            console.error('failed loading clerk for auth', ctx.clerk, ctx.isLoaded, ctx.clerk?.client);
            toast.error('Что-то пошло не так, попробуйте позже');
            return;
        }

        submitting = true;

        try {
            const signInAttempt = await ctx.clerk.client.signIn.attemptSecondFactor({
                strategy: 'email_code',
                code: verificationCode,
            });

            if (signInAttempt.status === 'complete') {
                await ctx.clerk.setActive({session: signInAttempt.createdSessionId});
                queryClient.clear();
                goto(normalizeRef(page.url.searchParams.get('ref')));
            } else {
                toast.error('Не удалось подтвердить код');
            }
        } catch (err: unknown) {
            const clerkError = err as {errors?: Array<{code: string; message: string}>};
            const errorMessage = clerkError.errors?.[0]?.message || 'Неверный код';
            console.error(errorMessage);
            toast.error('Ошибка авторизации');
        } finally {
            submitting = false;
        }
    }
</script>

<section
    class="from-muted via-background to-muted relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br p-6 dark:from-[oklch(0.129_0.042_264.695)] dark:via-[oklch(0.15_0.03_260)] dark:to-[oklch(0.129_0.042_264.695)]"
>
    <Background />

    <div class="relative z-10 w-full max-w-sm">
        <div
            class="bg-card ring-border relative overflow-hidden rounded-lg shadow-xl ring-1 shadow-black/5 dark:bg-white/10 dark:ring-white/20 dark:backdrop-blur-md dark:shadow-black/20 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
        >
            <div
                class="from-primary to-primary/50 absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r"
            ></div>
            <div class="px-8 py-10 sm:px-10 sm:py-12">
                <div class="mb-8 text-center">
                    <Logo class="mb-3 flex items-center justify-center gap-3 text-3xl" />
                </div>

                {#if needsSecondFactor}
                    <SecondFactorForm
                        bind:verificationCode
                        {submitting}
                        error={errors.code}
                        onsubmit={handleVerifyCode}
                        onback={() => (needsSecondFactor = false)}
                    />
                {:else}
                    <LoginForm
                        bind:email
                        bind:password
                        {submitting}
                        errors={{email: errors.email, password: errors.password}}
                        onsubmit={handleSubmit}
                    />

                    <SsoButtons />
                {/if}
            </div>
        </div>
    </div>
</section>
