<script lang="ts">
    import {Label} from '$lib/components/ui/label';
    import {getErrorArray} from '$lib/utils/formErrors';
    import {defaults, superForm} from 'sveltekit-superforms';
    import LoadingDots from '$lib/components/loadingDots.svelte';
    import {loginSchema} from './schema';
    import {toast} from 'svelte-sonner';
    import {normalizeRef} from '$lib/utils';
    import {page} from '$app/state';
    import {goto} from '$app/navigation';
    import {zod4, zod4Client} from 'sveltekit-superforms/adapters';
    import {useClerkContext} from 'svelte-clerk';
    import type {EmailCodeFactor} from '@clerk/types';
    import {Input} from '$lib/components/ui/input';
    import PasswordInput from '$lib/components/input/passwordInput.svelte';
    import {Button} from '$lib/components/ui/button';

    interface Props {
        onNeedsSecondFactor: () => void;
    }

    const ctx = useClerkContext();

    let {onNeedsSecondFactor}: Props = $props();

    function buildForgotPasswordUrl() {
        const ref = page.url.searchParams.get('ref');
        return ref
            ? `/login/forgot-password?ref=${encodeURIComponent(ref)}`
            : '/login/forgot-password';
    }

    async function handlePostSignInRedirect() {
        const ref = normalizeRef(page.url.searchParams.get('ref'), page.url.href);
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
                    await handlePostSignInRedirect();
                } else if (signInAttempt.status === 'needs_second_factor') {
                    const emailCodeFactor = signInAttempt.supportedSecondFactors?.find(
                        (factor): factor is EmailCodeFactor => factor.strategy === 'email_code',
                    );

                    if (emailCodeFactor) {
                        try {
                            await ctx.clerk.client.signIn.prepareSecondFactor({
                                strategy: 'email_code',
                                emailAddressId: emailCodeFactor.emailAddressId,
                            });
                            onNeedsSecondFactor();
                        } catch {
                            toast.error('Не удалось отправить код верификации, попробуйте позже');
                        }
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
                    await goto(buildForgotPasswordUrl());
                    return;
                }
                const errorMessage = firstError?.message || 'Неверный email или пароль';
                toast.error(errorMessage);
            }
        },
    });

    let {form: formData, errors, enhance, submitting} = loginForm;
</script>

<form class="flex flex-col gap-6" use:enhance>
    <div class="space-y-2">
        <Label for="email" class="text-foreground/80 text-sm font-medium">Email</Label>
        <Input
            id="email"
            name="email"
            type="email"
            placeholder="name@example.com"
            autocomplete="email"
            bind:value={$formData.email}
            aria-invalid={Boolean($errors.email) || undefined}
        />
        {#if $errors.email}
            <p class="text-destructive flex items-center gap-1.5 text-sm">
                <i class="fa-solid fa-circle-exclamation text-xs"></i>
                {getErrorArray($errors.email)?.[0] ?? 'Это непохоже на email'}
            </p>
        {/if}
    </div>

    <div class="space-y-2">
        <Label for="password" class="text-foreground/80 text-sm font-medium">Пароль</Label>
        <PasswordInput
            id="password"
            name="password"
            placeholder="Введите пароль"
            autocomplete="current-password"
            bind:value={$formData.password}
            aria-invalid={Boolean($errors.password) || undefined}
        />
        {#if $errors.password}
            <p class="text-destructive flex items-center gap-1.5 text-sm">
                <i class="fa-solid fa-circle-exclamation text-xs"></i>
                {getErrorArray($errors.password)?.[0] ?? 'Пожалуйста, введите пароль'}
            </p>
        {/if}
        <a
            href={buildForgotPasswordUrl()}
            class="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-sm font-medium transition-colors"
        >
            Забыли пароль?
        </a>
    </div>

    <div class="pt-2">
        <Button type="submit" size="lg" class="w-full" disabled={$submitting}>
            {#if $submitting}
                <LoadingDots />
            {:else}
                Войти
            {/if}
        </Button>
    </div>
</form>
