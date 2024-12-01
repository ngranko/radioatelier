<script lang="ts">
    import {createMutation} from '@tanstack/svelte-query';
    import Dialog from '$lib/components/dialog.svelte';
    import FormPasswordInput from '$lib/components/form/formPasswordInput.svelte';
    import PrimaryButton from '$lib/components/button/primaryButton.svelte';
    import TextButton from '$lib/components/button/textButton.svelte';
    import {changePassword} from '$lib/api/user';
    import type {ChangePasswordFormErrors, ChangePasswordFormInputs} from '$lib/interfaces/user';
    import {createForm} from 'felte';
    import {isPasswordAcceptable} from '$lib/services/passwordStrength';
    import RequestError from '$lib/errors/RequestError';
    import type {Payload} from '$lib/interfaces/api';
    import toast from 'svelte-french-toast';
    import {validator} from '@felte/validator-yup';
    import * as yup from 'yup';
    import type {TestContext} from 'yup';

    const schema = yup.object({
        password: yup
            .string()
            .required('Пожалуйста, введите пароль')
            .test('strongPassword', 'Слишком слабый пароль', isPasswordAcceptable),
        passwordConfirm: yup
            .string()
            .required('Пожалуйста, повторите пароль')
            .test(
                'passwordsMatch',
                'Пароли не совпадают',
                (value: string, context: TestContext) => value === context.parent.password,
            ),
    });

    interface Props {
        isDialogOpen?: boolean;
    }

    let {isDialogOpen = $bindable(false)}: Props = $props();

    const {form, data, errors, isSubmitting, reset} = createForm<yup.InferType<typeof schema>>({
        onSubmit: async (values: ChangePasswordFormInputs) =>
            $changePasswordMutation.mutateAsync(values),
        onSuccess: () => {
            toast.success('Пароль успешно изменен');
            isDialogOpen = false;
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
        isDialogOpen = false;
    }
</script>

<Dialog isOpen={isDialogOpen} on:close={handleDialogClose}>
    <h2>Сменить пароль</h2>
    <form class="form" use:form>
        <FormPasswordInput
            id="password"
            name="password"
            required
            label="Пароль"
            value={$data.password}
            error={$errors.password}
            withStrengthIndicator
        />
        <FormPasswordInput
            id="passwordConfirm"
            name="passwordConfirm"
            required
            label="Повторите пароль"
            error={$errors.passwordConfirm}
        />
        <div class="actions">
            <PrimaryButton disabled={$isSubmitting.valueOf()}>Сменить</PrimaryButton>
            <TextButton type="button" onClick={handleDialogClose}>Отменить</TextButton>
        </div>
    </form>
</Dialog>

<style lang="scss">
    .form {
        width: 280px;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .actions {
        margin-top: 8px;

        & :global(:first-child) {
            margin-right: 8px;
        }
    }
</style>
