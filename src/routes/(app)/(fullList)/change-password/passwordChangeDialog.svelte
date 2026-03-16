<script lang="ts">
    import {defaults, superForm} from 'sveltekit-superforms';
    import {toast} from 'svelte-sonner';
    import {Root as DialogRoot, Content, Title, Footer} from '$lib/components/ui/dialog';
    import {Button} from '$lib/components/ui/button';
    import {FormLabel, FormField, FormControl, FormFieldErrors} from '$lib/components/ui/form';
    import PasswordInput from '$lib/components/input/passwordInput.svelte';
    import {zod4, zod4Client} from 'sveltekit-superforms/adapters';
    import {goto} from '$app/navigation';
    import {schema} from './schema.ts';
    import {DialogClose} from '$lib/components/ui/dialog/index.ts';
    import {useClerkContext} from 'svelte-clerk';
    import {Checkbox} from '$lib/components/ui/checkbox';
    import KeyRoundIcon from '@lucide/svelte/icons/key-round';
    import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
    import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
    import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';

    const DIALOG_ANIMATION_DURATION = 200;

    interface Props {
        isOpen: boolean;
    }

    let {isOpen = $bindable()}: Props = $props();

    const ctx = useClerkContext();
    const isPasswordEnabled = $derived(ctx.clerk?.user?.passwordEnabled ?? true);

    async function signOutOtherSessions() {
        if (!ctx.clerk || !ctx.isLoaded || !ctx.clerk.user) {
            console.error(
                'failed loading clerk for sign out other sessions',
                ctx.clerk,
                ctx.isLoaded,
                ctx.clerk?.user,
            );
            toast.error('Что-то пошло не так, попробуйте позже');
            return;
        }

        try {
            const sessions = await ctx.clerk.user.getSessions();
            const currentSessionId = ctx.clerk.session?.id ?? '';
            const otherSessions = sessions.filter(session => session.id !== currentSessionId);

            if (!otherSessions.length) {
                return;
            }

            await Promise.all(otherSessions.map(session => session.revoke()));
        } catch {
            toast.error('Не удалось завершить другие сессии');
        }
    }

    const form = superForm(defaults(zod4(schema)), {
        SPA: true,
        validators: zod4Client(schema),
        onSubmit: async () => {
            const validation = await form.validateForm({update: true});
            if (!validation.valid) {
                return;
            }

            if (!isPasswordEnabled) {
                toast.error('Смена пароля доступна только для учетных записей с паролем');
                return;
            }

            if (!ctx.clerk || !ctx.isLoaded || !ctx.clerk.user) {
                console.error(
                    'failed loading clerk for password change',
                    ctx.clerk,
                    ctx.isLoaded,
                    ctx.clerk?.user,
                );
                toast.error('Что-то пошло не так, попробуйте позже');
                return;
            }

            try {
                await ctx.clerk.user.updatePassword({
                    currentPassword: validation.data.currentPassword,
                    newPassword: validation.data.password,
                });
                if (validation.data.signOutOtherSessions) {
                    await signOutOtherSessions();
                }
                toast.success('Пароль успешно изменен');
                setIsOpen(false);
            } catch (err: unknown) {
                const clerkError = err as {
                    errors?: Array<{
                        code: string;
                        message: string;
                        meta?: {paramName?: string};
                    }>;
                };
                const firstError = clerkError.errors?.[0];
                const paramName = firstError?.meta?.paramName;

                if (firstError) {
                    let fieldErrorSet = false;
                    if (
                        paramName === 'current_password' ||
                        firstError.code === 'form_password_incorrect'
                    ) {
                        errors.update(current => ({
                            ...current,
                            currentPassword: [firstError.message],
                        }));
                        fieldErrorSet = true;
                    } else if (
                        paramName === 'new_password' ||
                        paramName === 'password' ||
                        firstError.code.startsWith('form_password')
                    ) {
                        errors.update(current => ({
                            ...current,
                            password: [firstError.message],
                        }));
                        fieldErrorSet = true;
                    }

                    if (!fieldErrorSet) {
                        toast.error(firstError.message);
                    }
                } else {
                    toast.error('Не удалось сменить пароль');
                }
            }
        },
    });

    const {form: formData, errors, enhance, submitting} = form;

    function getIsOpen() {
        return isOpen;
    }

    function setIsOpen(newOpen: boolean) {
        isOpen = newOpen;
        if (!newOpen) {
            setTimeout(() => {
                goto('/');
            }, DIALOG_ANIMATION_DURATION);
        }
    }
</script>

<!-- prettier-ignore -->
<DialogRoot bind:open={getIsOpen, setIsOpen}>
    <Content class="overflow-hidden border-t-0 p-0 sm:max-w-md">
        <div
            class="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-primary via-primary/60 to-transparent"
        ></div>
        <div class="relative px-6 pt-6 pb-4">
            <div
                class="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-primary/[0.03] to-transparent"
            ></div>
            <div class="relative flex items-center gap-3.5">
                <div
                    class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20"
                >
                    <KeyRoundIcon class="size-[18px] text-primary" />
                </div>
                <div>
                    <Title class="text-[17px] font-semibold tracking-[-0.01em]">Сменить пароль</Title>
                    <p class="text-muted-foreground mt-0.5 text-[13px] leading-snug">
                        Обновите пароль для защиты учетной записи
                    </p>
                </div>
            </div>
        </div>

        <form method="POST" class="flex flex-col" use:enhance>
            {#if !isPasswordEnabled}
                <div class="mx-6 mb-1 flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/[0.07] px-3.5 py-3">
                    <TriangleAlertIcon class="mt-px size-4 shrink-0 text-warning" />
                    <p class="text-[13px] leading-snug text-warning">
                        Смена пароля доступна только для учетных записей с паролем.
                    </p>
                </div>
            {/if}

            <div class="border-border/50 border-b px-6 pb-4">
                <FormField {form} name="currentPassword">
                    <FormControl>
                        {#snippet children({props})}
                            <FormLabel class="text-[13px] font-medium">Текущий пароль</FormLabel>
                            <PasswordInput
                                bind:value={$formData.currentPassword}
                                disabled={!isPasswordEnabled}
                                {...props}
                            />
                        {/snippet}
                    </FormControl>
                    <FormFieldErrors />
                </FormField>
            </div>

            <div class="space-y-3.5 px-6 pt-4 pb-4">
                <FormField {form} name="password">
                    <FormControl>
                        {#snippet children({props})}
                            <FormLabel class="text-[13px] font-medium">Новый пароль</FormLabel>
                            <PasswordInput
                                bind:value={$formData.password}
                                disabled={!isPasswordEnabled}
                                {...props}
                            />
                            <p class="text-muted-foreground/70 mt-1.5 text-[12px] leading-relaxed">
                                Минимум 8 символов и не из списков взломанных паролей.
                            </p>
                        {/snippet}
                    </FormControl>
                    <FormFieldErrors />
                </FormField>
                <FormField {form} name="passwordConfirm">
                    <FormControl>
                        {#snippet children({props})}
                            <FormLabel class="text-[13px] font-medium">Повторите пароль</FormLabel>
                            <PasswordInput
                                bind:value={$formData.passwordConfirm}
                                disabled={!isPasswordEnabled}
                                {...props}
                            />
                        {/snippet}
                    </FormControl>
                    <FormFieldErrors />
                </FormField>
            </div>

            <div class="px-6 pb-5">
                <FormField {form} name="signOutOtherSessions" class="space-y-0">
                    <FormControl>
                        {#snippet children({props})}
                            <label
                                class="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-muted/50 px-3.5 py-3 shadow-xs transition-all select-none hover:border-primary/30 hover:bg-primary/[0.04] hover:shadow-sm"
                            >
                                <ShieldCheckIcon class="size-4 shrink-0 text-primary/60" />
                                <span class="text-[13px] leading-snug grow">
                                    Завершить другие сессии
                                </span>
                                <Checkbox
                                    {...props}
                                    bind:checked={$formData.signOutOtherSessions}
                                    disabled={!isPasswordEnabled}
                                />
                            </label>
                        {/snippet}
                    </FormControl>
                    <FormFieldErrors />
                </FormField>
            </div>

            <Footer class="border-border/50 gap-3 border-t bg-muted/20 px-6 py-4">
                <DialogClose disabled={$submitting} class="mr-2">
                    Отменить
                </DialogClose>
                <Button
                    variant="default"
                    type="submit"
                    disabled={$submitting || !isPasswordEnabled}
                    class="min-w-[7rem]"
                >
                    {#if $submitting}
                        <LoaderCircleIcon class="size-4 animate-spin" />
                    {:else}
                        Сменить пароль
                    {/if}
                </Button>
            </Footer>
        </form>
    </Content>
</DialogRoot>
