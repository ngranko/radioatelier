<script lang="ts">
    import {page} from '$app/state';
    import {goto} from '$app/navigation';
    import {useClerkContext} from 'svelte-clerk';
    import {useQueryClient} from '@tanstack/svelte-query';
    import {defaults, superForm} from 'sveltekit-superforms';
    import {zod4, zod4Client} from 'sveltekit-superforms/adapters';
    import {toast} from 'svelte-sonner';
    import {normalizeRef} from '$lib/utils';
    import {getErrorArray} from '$lib/utils/formErrors';
    import {Label} from '$lib/components/ui/label';
    import {resetPasswordConfirmSchema} from '../schema';
    import AuthInput from '../authInput.svelte';
    import AuthPasswordInput from '../authPasswordInput.svelte';
    import AuthButton from '../authButton.svelte';
    import LoadingDots from '$lib/components/loadingDots.svelte';

    interface Props {
        requestedEmail: string;
        onBack: () => void;
    }

    const queryClient = useQueryClient();
    const ctx = useClerkContext();

    let {requestedEmail = $bindable(''), onBack}: Props = $props();

    async function handlePostSignInRedirect() {
        const ref = normalizeRef(page.url.searchParams.get('ref'));
        if (ctx.clerk?.session?.currentTask?.key === 'reset-password') {
            await goto(`/login/reset-password?ref=${encodeURIComponent(ref)}`);
            return;
        }
        await goto(ref);
    }

    const form = superForm(defaults(zod4(resetPasswordConfirmSchema)), {
        SPA: true,
        validators: zod4Client(resetPasswordConfirmSchema),
        onSubmit: async () => {
            const validation = await form.validateForm({update: true});
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

    let {form: formData, errors, enhance, submitting} = form;
</script>

<form class="flex flex-col gap-5" use:enhance>
    <div
        class="bg-success/10 dark:bg-success/15 border-success/30 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border"
    >
        <i class="fa-solid fa-envelope-circle-check text-success text-xl"></i>
    </div>

    <p class="text-muted-foreground text-center text-sm leading-relaxed">
        Код отправлен на <span class="text-foreground font-medium">
            {requestedEmail}
        </span>
    </p>

    <div class="space-y-2">
        <Label for="reset-code" class="text-foreground/80 text-sm font-medium">
            Код подтверждения
        </Label>
        <AuthInput
            id="reset-code"
            name="verificationCode"
            type="text"
            inputmode="numeric"
            placeholder="000000"
            autocomplete="one-time-code"
            bind:value={$formData.verificationCode}
            hasError={Boolean($errors.verificationCode)}
        />
        {#if $errors.verificationCode}
            <p class="text-destructive flex items-center gap-1.5 text-sm">
                <i class="fa-solid fa-circle-exclamation text-xs"></i>
                {getErrorArray($errors.verificationCode)?.[0] ??
                    'Введите код подтверждения'}
            </p>
        {/if}
    </div>

    <div class="space-y-2">
        <Label for="reset-password" class="text-foreground/80 text-sm font-medium">
            Новый пароль
        </Label>
        <AuthPasswordInput
            id="reset-password"
            name="password"
            placeholder="Минимум 8 символов"
            autocomplete="new-password"
            bind:value={$formData.password}
            hasError={Boolean($errors.password)}
        />
        {#if $errors.password}
            <p class="text-destructive flex items-center gap-1.5 text-sm">
                <i class="fa-solid fa-circle-exclamation text-xs"></i>
                {getErrorArray($errors.password)?.[0] ?? 'Введите новый пароль'}
            </p>
        {/if}
    </div>

    <div class="space-y-2">
        <Label for="reset-password-confirm" class="text-foreground/80 text-sm font-medium">
            Повторите пароль
        </Label>
        <AuthPasswordInput
            id="reset-password-confirm"
            name="confirmPassword"
            placeholder="Повторите новый пароль"
            autocomplete="new-password"
            bind:value={$formData.confirmPassword}
            hasError={Boolean($errors.confirmPassword)}
        />
        {#if $errors.confirmPassword}
            <p class="text-destructive flex items-center gap-1.5 text-sm">
                <i class="fa-solid fa-circle-exclamation text-xs"></i>
                {getErrorArray($errors.confirmPassword)?.[0] ?? 'Пароли не совпадают'}
            </p>
        {/if}
    </div>

    <div class="flex flex-col gap-3 pt-1">
        <AuthButton type="submit" loading={$submitting}>
            {#if $submitting}
                <LoadingDots />
            {:else}
                Сбросить пароль
            {/if}
        </AuthButton>

        <AuthButton type="button" variant="ghost" onclick={onBack} loading={$submitting}>
            <i class="fa-solid fa-arrow-left mr-2 text-sm"></i>
            <span>Назад</span>
        </AuthButton>
    </div>
</form>
