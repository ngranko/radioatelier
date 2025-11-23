<script lang="ts">
    import {createMutation, useQueryClient} from '@tanstack/svelte-query';
    import {login} from '$lib/api/auth';
    import {page} from '$app/state';
    import {goto} from '$app/navigation';
    import {defaults, superForm} from 'sveltekit-superforms';
    import {zod4, zod4Client} from 'sveltekit-superforms/adapters';
    import RequestError from '$lib/errors/RequestError';
    import type {Payload} from '$lib/interfaces/api';
    import {toast} from 'svelte-sonner';
    import {z} from 'zod';
    import {Button} from '$lib/components/ui/button';
    import Logo from './logo.svelte';
    import {FormField, FormControl, FormLabel, FormFieldErrors} from '$lib/components/ui/form';
    import {Input} from '$lib/components/ui/input';
    import PasswordInput from '$lib/components/input/passwordInput.svelte';
    import {normalizeFormErrors} from '$lib/utils/formErrors.ts';

    const queryClient = useQueryClient();

    const mutation = createMutation({
        mutationFn: login,
    });

    const schema = z.object({
        email: z.email('Это непохоже на email'),
        password: z.string().min(1, 'Пожалуйста, введите пароль'),
    });

    type LoginFormInputs = z.infer<typeof schema>;

    const form = superForm<LoginFormInputs>(defaults(zod4(schema)), {
        SPA: true,
        validators: zod4Client(schema),
        onUpdate: async ({form}) => {
            if (!form.valid) {
                return;
            }
            try {
                await $mutation.mutateAsync(form.data);
                queryClient.clear();
                const ref = page.url.searchParams.get('ref');
                await goto(ref ?? '/');
            } catch (error) {
                if (error instanceof RequestError && (error.payload as Payload).errors) {
                    form.valid = false;
                    const formErrors = (error.payload as Payload).errors;
                    if (formErrors) {
                        form.errors = normalizeFormErrors(formErrors, form.data);
                    }
                } else {
                    console.log(error);
                    toast.error('Вход не удался');
                }
            }
        },
    });

    const {form: formData, enhance, submitting} = form;
</script>

<section class="flex min-h-screen flex-col items-center justify-center bg-muted p-6">
    <div class="w-full max-w-sm space-y-6">
        <div class="flex flex-col items-center space-y-2 text-center">
            <Logo class="mb-2 flex items-center justify-center" />
            <p class="text-sm text-muted-foreground">
                Введите свои данные для входа в систему
            </p>
        </div>

        <div class="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div class="p-6 pt-6">
                <form class="flex flex-col gap-4" use:enhance>
                    <FormField {form} name="email">
                        <FormControl>
                            {#snippet children({props})}
                                <FormLabel>Email</FormLabel>
                                <Input type="email" placeholder="name@example.com" {...props} bind:value={$formData.email} />
                            {/snippet}
                        </FormControl>
                        <FormFieldErrors />
                    </FormField>
                    <FormField {form} name="password">
                        <FormControl>
                            {#snippet children({props})}
                                <FormLabel>Пароль</FormLabel>
                                <PasswordInput placeholder="••••••••" {...props} bind:value={$formData.password} />
                            {/snippet}
                        </FormControl>
                        <FormFieldErrors />
                    </FormField>
                    <div class="mt-2">
                        <Button type="submit" class="w-full text-base" disabled={$submitting}>
                            {#if $submitting}
                                Вход...
                            {:else}
                                Войти
                            {/if}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</section>
