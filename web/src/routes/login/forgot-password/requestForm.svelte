<script lang="ts">
    import {page} from '$app/state';
    import {useClerkContext} from 'svelte-clerk';
    import {defaults, superForm} from 'sveltekit-superforms';
    import {zod4, zod4Client} from 'sveltekit-superforms/adapters';
    import {toast} from 'svelte-sonner';
    import {getErrorArray} from '$lib/utils/formErrors';
    import {Label} from '$lib/components/ui/label';
    import {resetPasswordRequestSchema} from '../schema';
    import type {ResetPasswordEmailCodeFactor} from '@clerk/types';
    import {Input} from '$lib/components/ui/input';
    import {Button} from '$lib/components/ui/button';
    import LoadingDots from '$lib/components/loadingDots.svelte';

    interface Props {
        requestedEmail: string;
        onSubmit: () => void;
    }

    const ctx = useClerkContext();

    let {requestedEmail = $bindable(''), onSubmit}: Props = $props();

    const form = superForm(defaults(zod4(resetPasswordRequestSchema)), {
        SPA: true,
        validators: zod4Client(resetPasswordRequestSchema),
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
                onSubmit();
                toast.success('Мы отправили код подтверждения');
            } catch (err: unknown) {
                const clerkError = err as {errors?: Array<{code: string; message: string}>};
                const errorMessage =
                    clerkError.errors?.[0]?.message || 'Не удалось отправить код подтверждения';
                toast.error(errorMessage);
            }
        },
    });

    let {form: formData, errors, enhance, submitting} = form;

    function buildBackUrl() {
        const ref = page.url.searchParams.get('ref');
        return ref ? `/login?ref=${encodeURIComponent(ref)}` : '/login';
    }
</script>

<form class="flex flex-col gap-6" use:enhance>
    <div
        class="bg-warning/10 dark:bg-warning/15 border-warning/30 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border"
    >
        <i class="fa-solid fa-key text-warning text-2xl"></i>
    </div>

    <p class="text-muted-foreground text-center text-sm leading-relaxed">
        Введите email, связанный с вашим аккаунтом. Мы отправим на него код для сброса пароля.
    </p>

    <div class="space-y-2">
        <Label for="reset-email" class="text-foreground/80 text-sm font-medium">Email</Label>
        <Input
            id="reset-email"
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

    <div class="flex flex-col gap-3 pt-2">
        <Button type="submit" size="lg" class="w-full" disabled={$submitting}>
            {#if $submitting}
                <LoadingDots />
            {:else}
                Отправить код
            {/if}
        </Button>

        <Button
            variant="ghost"
            size="lg"
            class="w-full"
            href={buildBackUrl()}
            disabled={$submitting}
        >
            <i class="fa-solid fa-arrow-left mr-2 text-sm"></i>
            <span>Назад</span>
        </Button>
    </div>
</form>
