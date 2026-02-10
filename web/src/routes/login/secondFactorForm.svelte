<script lang="ts">
    import {Label} from '$lib/components/ui/label';
    import {getErrorArray} from '$lib/utils/formErrors';
    import {defaults, superForm} from 'sveltekit-superforms';
    import LoadingDots from '$lib/components/loadingDots.svelte';
    import {secondFactorSchema} from './schema';
    import {normalizeRef} from '$lib/utils';
    import {page} from '$app/state';
    import {toast} from 'svelte-sonner';
    import {zod4, zod4Client} from 'sveltekit-superforms/adapters';
    import {useQueryClient} from '@tanstack/svelte-query';
    import {useClerkContext} from 'svelte-clerk';
    import {goto} from '$app/navigation';
    import AuthInput from './authInput.svelte';
    import AuthButton from './authButton.svelte';

    interface Props {
        onBack: () => void;
    }

    const queryClient = useQueryClient();
    const ctx = useClerkContext();

    let {onBack}: Props = $props();

    async function handlePostSignInRedirect() {
        const ref = normalizeRef(page.url.searchParams.get('ref'));
        if (ctx.clerk?.session?.currentTask?.key === 'reset-password') {
            await goto(`/login/reset-password?ref=${encodeURIComponent(ref)}`);
            return;
        }
        await goto(ref);
    }

    const secondFactorForm = superForm(defaults(zod4(secondFactorSchema)), {
        SPA: true,
        validators: zod4Client(secondFactorSchema),
        onSubmit: async () => {
            const validation = await secondFactorForm.validateForm({update: true});
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
                const signInAttempt = await ctx.clerk.client.signIn.attemptSecondFactor({
                    strategy: 'email_code',
                    code: validation.data.verificationCode,
                });

                if (signInAttempt.status === 'complete') {
                    await ctx.clerk.setActive({session: signInAttempt.createdSessionId});
                    queryClient.clear();
                    await handlePostSignInRedirect();
                } else {
                    toast.error('Не удалось подтвердить код');
                }
            } catch (err: unknown) {
                const clerkError = err as {errors?: Array<{code: string; message: string}>};
                const errorMessage = clerkError.errors?.[0]?.message || 'Неверный код';
                console.error(errorMessage);
                toast.error('Ошибка авторизации');
            }
        },
    });

    let {form: formData, errors, enhance, submitting} = secondFactorForm;
</script>

<form class="flex flex-col gap-6" use:enhance>
    <div
        class="bg-primary/5 dark:bg-primary/10 border-primary/20 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border"
    >
        <i class="fa-solid fa-envelope-open-text text-primary text-2xl"></i>
    </div>

    <p class="text-muted-foreground text-center text-sm leading-relaxed">
        Мы отправили код подтверждения на вашу почту. Введите его ниже для завершения входа.
    </p>

    <div class="space-y-2">
        <Label for="code" class="text-foreground/80 text-sm font-medium">Код подтверждения</Label>
        <AuthInput
            id="code"
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
                {getErrorArray($errors.verificationCode)?.[0] ?? 'Введите код подтверждения'}
            </p>
        {/if}
    </div>

    <div class="flex flex-col gap-3 pt-2">
        <AuthButton type="submit" loading={$submitting}>
            {#if $submitting}
                <LoadingDots />
            {:else}
                <span>Подтвердить</span>
            {/if}
        </AuthButton>

        <AuthButton type="button" variant="ghost" onclick={onBack}>
            <i class="fa-solid fa-arrow-left mr-2 text-sm"></i>
            <span>Назад</span>
        </AuthButton>
    </div>
</form>
