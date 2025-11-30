<script lang="ts">
    import {superForm} from 'sveltekit-superforms';
    import {toast} from 'svelte-sonner';
    import {Root as DialogRoot, Content, Header, Title, Footer} from '$lib/components/ui/dialog';
    import {Button} from '$lib/components/ui/button';
    import {FormLabel, FormField, FormControl, FormFieldErrors} from '$lib/components/ui/form';
    import PasswordInput from '$lib/components/input/passwordInput.svelte';
    import {zod4Client} from 'sveltekit-superforms/adapters';
    import {goto} from '$app/navigation';
    import {page} from '$app/state';
    import {schema} from './schema.ts';
    import {DialogClose} from '$lib/components/ui/dialog/index.ts';

    const DIALOG_ANIMATION_DURATION = 200;

    interface Props {
        isOpen: boolean;
    }

    let {isOpen = $bindable()}: Props = $props();

    const form = superForm(page.data.form, {
        validators: zod4Client(schema),
        onResult: ({result}) => {
            if (result.type === 'redirect') {
                toast.success('Пароль успешно изменен');
                isOpen = false;
                return;
            }
        },
        onError: ({result}) => {
            toast.error(result.error?.message ?? 'Не удалось сменить пароль');
        },
    });

    const {form: formData, enhance, submitting} = form;

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
    <Content>
        <Header>
            <Title>Сменить пароль</Title>
        </Header>
        <form method="POST" class="flex w-full flex-col gap-4" use:enhance>
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
                        <PasswordInput bind:value={$formData.passwordConfirm} {...props} />
                    {/snippet}
                </FormControl>
                <FormFieldErrors />
            </FormField>
            <Footer class="gap-4">
                <DialogClose disabled={$submitting}>
                    Отменить
                </DialogClose>
                <Button variant="default" type="submit" disabled={$submitting}>Сменить</Button>
            </Footer>
        </form>
    </Content>
</DialogRoot>
