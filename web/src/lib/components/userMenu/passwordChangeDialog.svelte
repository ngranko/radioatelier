<script lang="ts">
    import {createMutation} from '@tanstack/svelte-query';
    import FormPasswordInput from '$lib/components/form/formPasswordInput.svelte';
    import {changePassword} from '$lib/api/user';
    import type {ChangePasswordFormErrors, ChangePasswordFormInputs} from '$lib/interfaces/user';
    import {createForm} from 'felte';
    import {isPasswordAcceptable} from '$lib/services/passwordStrength';
    import RequestError from '$lib/errors/RequestError';
    import type {Payload} from '$lib/interfaces/api';
    import { toast } from 'svelte-sonner';
    import {validator} from '@felte/validator-zod';
    import * as zod from 'zod';
    import * as Dialog from '$lib/components/ui/dialog';
    import {Button} from '$lib/components/ui/button';

    interface Props {
        isOpen: boolean;
    }

    let {isOpen = $bindable()}: Props = $props();

    const schema = zod
        .object({
            password: zod.string().nonempty('Пожалуйста, введите пароль'),
            passwordConfirm: zod.string().nonempty('Пожалуйста, повторите пароль'),
        })
        .refine(obj => obj.password === obj.passwordConfirm, {message: 'Пароли не совпадают'})
        .refine(obj => isPasswordAcceptable(obj.password), {message: 'Слишком слабый пароль'});

    const {form, data, errors, isSubmitting, reset} = createForm<zod.infer<typeof schema>>({
        onSubmit: async (values: ChangePasswordFormInputs) =>
            $changePasswordMutation.mutateAsync(values),
        onSuccess: () => {
            toast.success('Пароль успешно изменен');
            isOpen = false;
        },
        onError: error => {
            if (error instanceof RequestError && error.status === 422) {
                return (error.payload as Payload<null, ChangePasswordFormErrors>).errors;
            }
            toast.error('Не удалось сменить пароль');
        },
        extend: validator({schema}),
    });

    const changePasswordMutation = createMutation({
        mutationFn: changePassword,
    });

    function handleDialogClose() {
        reset();
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
<Dialog.Root bind:open={getIsOpen, setIsOpen}>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>Сменить пароль</Dialog.Title>
        </Dialog.Header>
        <form class="flex w-full flex-col gap-4" use:form>
            <FormPasswordInput
                id="password"
                name="password"
                required
                label="Пароль"
                value={$data.password}
                error={$errors.password}
                withStrengthIndicator={true}
            />
            <FormPasswordInput
                id="passwordConfirm"
                name="passwordConfirm"
                required
                label="Повторите пароль"
                error={$errors.passwordConfirm}
            />
            <Dialog.Footer>
                <Button
                    variant="ghost"
                    onclick={handleDialogClose}
                    disabled={$isSubmitting.valueOf()}
                >
                    Отменить
                </Button>
                <Button variant="default" type="submit" disabled={$isSubmitting.valueOf()}>
                    Сменить
                </Button>
            </Dialog.Footer>
        </form>
    </Dialog.Content>
</Dialog.Root>
