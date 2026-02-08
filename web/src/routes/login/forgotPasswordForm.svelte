<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import {Label} from '$lib/components/ui/label';
    import {Input} from '$lib/components/ui/input';
    import PasswordInput from '$lib/components/input/passwordInput.svelte';
    import {getErrorArray} from '$lib/utils/formErrors';
    import {defaults, superForm} from 'sveltekit-superforms';
    import LoadingDots from './loadingDots.svelte';
    import {resetPasswordConfirmSchema, resetPasswordRequestSchema} from './schema';
    import {toast} from 'svelte-sonner';
    import {normalizeRef} from '$lib/utils';
    import {page} from '$app/state';
    import {goto} from '$app/navigation';
    import {zod4, zod4Client} from 'sveltekit-superforms/adapters';
    import {useQueryClient} from '@tanstack/svelte-query';
    import {useClerkContext} from 'svelte-clerk';
    import type {ResetPasswordEmailCodeFactor} from '@clerk/types';

    interface Props {
        onBack: () => void;
    }

    const queryClient = useQueryClient();
    const ctx = useClerkContext();

    let {onBack}: Props = $props();
    let step = $state<'request' | 'reset'>('request');
    let requestedEmail = $state('');

    async function handlePostSignInRedirect() {
        const ref = normalizeRef(page.url.searchParams.get('ref'));
        if (ctx.clerk?.session?.currentTask?.key === 'reset-password') {
            await goto(`/login/reset-password?ref=${encodeURIComponent(ref)}`);
            return;
        }
        await goto(ref);
    }

    const requestForm = superForm(defaults(zod4(resetPasswordRequestSchema)), {
        SPA: true,
        validators: zod4Client(resetPasswordRequestSchema),
        onSubmit: async () => {
            const validation = await requestForm.validateForm({update: true});
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
                });

                const resetPasswordFactor = signInAttempt.supportedFirstFactors?.find(
                    (factor): factor is ResetPasswordEmailCodeFactor =>
                        factor.strategy === 'reset_password_email_code',
                );

                if (!resetPasswordFactor) {
                    toast.error('Не удалось отправить код подтверждения');
                    return;
                }

                await signInAttempt.prepareFirstFactor({
                    strategy: 'reset_password_email_code',
                    emailAddressId: resetPasswordFactor.emailAddressId,
                });

                requestedEmail = validation.data.email;
                step = 'reset';
                toast.success('Мы отправили код подтверждения');
            } catch (err: unknown) {
                const clerkError = err as {errors?: Array<{code: string; message: string}>};
                const errorMessage =
                    clerkError.errors?.[0]?.message || 'Не удалось отправить код подтверждения';
                toast.error(errorMessage);
            }
        },
    });

    const confirmForm = superForm(defaults(zod4(resetPasswordConfirmSchema)), {
        SPA: true,
        validators: zod4Client(resetPasswordConfirmSchema),
        onSubmit: async () => {
            const validation = await confirmForm.validateForm({update: true});
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
                const signInAttempt = await ctx.clerk.client.signIn.attemptFirstFactor({
                    strategy: 'reset_password_email_code',
                    code: validation.data.verificationCode,
                    password: validation.data.password,
                });

                if (signInAttempt.status === 'complete') {
                    await ctx.clerk.setActive({session: signInAttempt.createdSessionId});
                    queryClient.clear();
                    await handlePostSignInRedirect();
                } else {
                    toast.error('Не удалось завершить восстановление');
                }
            } catch (err: unknown) {
                const clerkError = err as {errors?: Array<{code: string; message: string}>};
                const errorMessage =
                    clerkError.errors?.[0]?.message || 'Не удалось подтвердить код';
                toast.error(errorMessage);
            }
        },
    });

    let {
        form: requestData,
        errors: requestErrors,
        enhance: requestEnhance,
        submitting: requesting,
    } = requestForm;
    let {
        form: confirmData,
        errors: confirmErrors,
        enhance: confirmEnhance,
        submitting: confirming,
    } = confirmForm;
</script>

{#if step === 'request'}
    <form class="flex flex-col gap-5" use:requestEnhance>
        <p class="text-muted-foreground text-center text-sm">
            Введите email, чтобы получить код для восстановления пароля
        </p>
        <div class="space-y-2">
            <Label for="reset-email">Email</Label>
            <Input
                id="reset-email"
                name="email"
                type="email"
                placeholder="name@example.com"
                class="focus-visible:border-primary focus-visible:ring-primary/30"
                bind:value={$requestData.email}
            />
            {#if $requestErrors.email}
                <p class="text-destructive text-sm">
                    {getErrorArray($requestErrors.email)?.[0] ?? 'Это непохоже на email'}
                </p>
            {/if}
        </div>
        <div class="mt-2">
            <Button type="submit" class="w-full text-base" disabled={$requesting}>
                {#if $requesting}
                    <LoadingDots />
                {:else}
                    Отправить код
                {/if}
            </Button>
        </div>
        <Button type="button" variant="ghost" class="text-sm" onclick={onBack}>Назад</Button>
    </form>
{:else}
    <form class="flex flex-col gap-5" use:confirmEnhance>
        <p class="text-muted-foreground text-center text-sm">
            Код подтверждения отправлен на {requestedEmail || 'вашу почту'}
        </p>
        <div class="space-y-2">
            <Label for="reset-code">Код подтверждения</Label>
            <Input
                id="reset-code"
                name="verificationCode"
                type="text"
                inputmode="numeric"
                placeholder="123456"
                class="focus-visible:border-primary focus-visible:ring-primary/30"
                bind:value={$confirmData.verificationCode}
            />
            {#if $confirmErrors.verificationCode}
                <p class="text-destructive text-sm">
                    {getErrorArray($confirmErrors.verificationCode)?.[0] ??
                        'Введите код подтверждения'}
                </p>
            {/if}
        </div>
        <div class="space-y-2">
            <Label for="reset-password">Новый пароль</Label>
            <PasswordInput
                id="reset-password"
                name="password"
                placeholder="••••••••"
                class="focus-visible:border-primary focus-visible:ring-primary/30"
                bind:value={$confirmData.password}
            />
            {#if $confirmErrors.password}
                <p class="text-destructive text-sm">
                    {getErrorArray($confirmErrors.password)?.[0] ?? 'Введите новый пароль'}
                </p>
            {/if}
        </div>
        <div class="space-y-2">
            <Label for="reset-password-confirm">Повторите пароль</Label>
            <PasswordInput
                id="reset-password-confirm"
                name="confirmPassword"
                placeholder="••••••••"
                class="focus-visible:border-primary focus-visible:ring-primary/30"
                bind:value={$confirmData.confirmPassword}
            />
            {#if $confirmErrors.confirmPassword}
                <p class="text-destructive text-sm">
                    {getErrorArray($confirmErrors.confirmPassword)?.[0] ?? 'Пароли не совпадают'}
                </p>
            {/if}
        </div>
        <div class="mt-2">
            <Button type="submit" class="w-full text-base" disabled={$confirming}>
                {#if $confirming}
                    <LoadingDots />
                {:else}
                    Сбросить пароль
                {/if}
            </Button>
        </div>
        <Button type="button" variant="ghost" class="text-sm" onclick={onBack}>Назад</Button>
    </form>
{/if}
