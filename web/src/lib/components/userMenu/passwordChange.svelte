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

    export let isDialogOpen = false;

    const {form, data, errors, isSubmitting, reset} = createForm({
        onSubmit: async (values: ChangePasswordFormInputs) => {
            await $changePasswordMutation.mutateAsync(values);
        },
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
        validate: (values: ChangePasswordFormInputs) => {
            const errors: ChangePasswordFormErrors = {};
            if (!values.password) {
                errors.password = 'Пожалуйста, введите пароль';
            }
            if (!isPasswordAcceptable(values.password)) {
                errors.password = 'Слишком слабый пароль';
            }
            if (!values.passwordConfirm) {
                errors.passwordConfirm = 'Пожалуйста, введите пароль еще раз';
            }
            if (values.password !== values.passwordConfirm) {
                errors.passwordConfirm = 'Пароли не совпадают';
            }
            return errors;
        },
    });

    const changePasswordMutation = createMutation({
        mutationFn: changePassword,
    });

    function handleDialogClose() {
        isDialogOpen = false;
        reset();
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
            error={Boolean($errors.password)}
            errorMessage={$errors.password ? $errors.password[0] : undefined}
            withStrengthIndicator
        />
        <FormPasswordInput
            id="passwordConfirm"
            name="passwordConfirm"
            required
            label="Повторите пароль"
            error={Boolean($errors.passwordConfirm)}
            errorMessage={$errors.passwordConfirm ? $errors.passwordConfirm[0] : undefined}
        />
        <div class="actions">
            <PrimaryButton disabled={$isSubmitting.valueOf()}>Сменить</PrimaryButton>
            <TextButton type="button" on:click={handleDialogClose}>Отменить</TextButton>
        </div>
    </form>
</Dialog>

<style lang="scss">
    .form {
        width: 280px;
        display: flex;
        flex-direction: column;
    }

    .actions {
        margin-top: 16px;

        & :global(:first-child) {
            margin-right: 8px;
        }
    }
</style>
