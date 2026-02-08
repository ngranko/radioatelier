<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import {Label} from '$lib/components/ui/label';
    import {Input} from '$lib/components/ui/input';
    import {getErrorArray} from '$lib/utils/formErrors';
    import {defaults, superForm} from 'sveltekit-superforms';
    import LoadingDots from './loadingDots.svelte';
    import {secondFactorSchema} from './schema';
    import { normalizeRef } from '$lib/utils';
    import { page } from '$app/state';
    import { toast } from 'svelte-sonner';
    import { zod4, zod4Client } from 'sveltekit-superforms/adapters';
    import { useQueryClient } from '@tanstack/svelte-query';
    import { useClerkContext } from 'svelte-clerk';
    import { goto } from '$app/navigation';

    interface Props {
        onBack: () => void;
    }

    const queryClient = useQueryClient();
    const ctx = useClerkContext();

    let {onBack}: Props = $props();

    const secondFactorForm = superForm(defaults(zod4(secondFactorSchema)), {
        SPA: true,
        validators: zod4Client(secondFactorSchema),
        onSubmit: async () => {
            const validation = await secondFactorForm.validateForm({update: true});
            if (!validation.valid) {
                return;
            }

            if (!ctx.clerk || !ctx.isLoaded || !ctx.clerk.client) {
                console.error('failed loading clerk for auth', ctx.clerk, ctx.isLoaded, ctx.clerk?.client);
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
                    goto(normalizeRef(page.url.searchParams.get('ref')));
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

<form class="flex flex-col gap-5" use:enhance>
    <p class="text-muted-foreground text-center text-sm">
        Код подтверждения отправлен на вашу почту
    </p>
    <div class="space-y-2">
        <Label for="code">Код подтверждения</Label>
        <Input
            id="code"
            name="verificationCode"
            type="text"
            inputmode="numeric"
            placeholder="123456"
            class="focus-visible:border-primary focus-visible:ring-primary/30"
            bind:value={$formData.verificationCode}
        />
        {#if $errors.verificationCode}
            <p class="text-destructive text-sm">
                {getErrorArray($errors.verificationCode)?.[0] ?? 'Введите код подтверждения'}
            </p>
        {/if}
    </div>
    <div class="mt-2">
        <Button type="submit" class="w-full text-base" disabled={$submitting}>
            {#if $submitting}
                <LoadingDots />
            {:else}
                Подтвердить
            {/if}
        </Button>
    </div>
    <Button type="button" variant="ghost" class="text-sm" onclick={onBack}>Назад</Button>
</form>
