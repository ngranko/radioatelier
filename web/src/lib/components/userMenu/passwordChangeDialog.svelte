<script lang="ts">
    import {createMutation} from '@tanstack/svelte-query';
    import {changePassword} from '$lib/api/user';
    import {defaults, superForm} from 'sveltekit-superforms';
    import {isPasswordAcceptable} from '$lib/services/passwordStrength';
    import RequestError from '$lib/errors/RequestError';
    import type {Payload} from '$lib/interfaces/api';
    import {toast} from 'svelte-sonner';
    import {z} from 'zod';
    import {Root as DialogRoot, Content, Header, Title, Footer} from '$lib/components/ui/dialog';
    import {Button} from '$lib/components/ui/button';
    import {FormLabel, FormField, FormControl, FormFieldErrors} from '$lib/components/ui/form';
    import PasswordInput from '$lib/components/input/passwordInput.svelte';
    import {zod4} from 'sveltekit-superforms/adapters';
    import { normalizeFormErrors } from '$lib/utils/formErrors';

    interface Props {
        isOpen: boolean;
    }

    let {isOpen = $bindable()}: Props = $props();

    const schema = z
        .object({
            password: z.string().min(1, 'Пожалуйста, введите пароль'),
            passwordConfirm: z.string().min(1, 'Пожалуйста, повторите пароль'),
        })
        .superRefine((data, ctx) => {
            if (data.password !== data.passwordConfirm) {
                ctx.addIssue({
                    code: 'custom',
                    message: 'Пароли не совпадают',
                    path: ['passwordConfirm'],
                });
            }
            if (!isPasswordAcceptable(data.password)) {
                ctx.addIssue({
                    code: 'custom',
                    message: 'Слишком слабый пароль',
                    path: ['password'],
                });
            }
        });

    type ChangePasswordFormInputs = z.infer<typeof schema>;

    const changePasswordMutation = createMutation({
        mutationFn: changePassword,
    });

    const form = superForm<ChangePasswordFormInputs>(defaults(zod4(schema)), {
        SPA: true,
        onUpdate: async ({form}) => {
            if (!form.valid) {
                return;
            }

            try {
                await $changePasswordMutation.mutateAsync($formData as ChangePasswordFormInputs);
                toast.success('Пароль успешно изменен');
                isOpen = false;
            } catch (error) {
                if (error instanceof RequestError && error.status === 422) {
                    form.valid = false;
                    const formErrors = (error.payload as Payload).errors;
                    if (formErrors) {
                        form.errors = normalizeFormErrors(formErrors, form.data);
                    }
                } else {
                    toast.error('Не удалось сменить пароль');
                }
            }
        },
    });

    const {form: formData, enhance, submitting} = form;

    function handleDialogClose() {
        form.reset();
        setIsOpen(false);
    }

    function getIsOpen() {
        return isOpen;
    }

    function setIsOpen(newOpen: boolean) {
        isOpen = newOpen;
    }
</script>

<!-- prettier-ignore -->
<DialogRoot bind:open={getIsOpen, setIsOpen}>
    <Content>
        <Header>
            <Title>Сменить пароль</Title>
        </Header>
        <form class="flex w-full flex-col gap-4" use:enhance>
            <FormField {form} name="password">
                <FormControl>
                    {#snippet children({props})}
                        <FormLabel>Пароль</FormLabel>
                        <PasswordInput
                            bind:value={$formData.password}
                            withStrengthIndicator={true}
                            {...props}
                        />
                    {/snippet}
                </FormControl>
                <FormFieldErrors />
            </FormField>
            <FormField {form} name="passwordConfirm">
                <FormControl>
                    {#snippet children({props})}
                        <FormLabel>Повторите пароль</FormLabel>
                        <PasswordInput
                            bind:value={$formData.passwordConfirm}
                            {...props}
                        />
                    {/snippet}
                </FormControl>
                <FormFieldErrors />
            </FormField>
            <Footer>
                <Button
                    variant="ghost"
                    onclick={handleDialogClose}
                    disabled={$submitting}
                >
                    Отменить
                </Button>
                <Button variant="default" type="submit" disabled={$submitting}>
                    Сменить
                </Button>
            </Footer>
        </form>
    </Content>
</DialogRoot>
