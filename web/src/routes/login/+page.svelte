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
    import Background from './background.svelte';

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

<section class="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-muted via-background to-muted dark:from-[oklch(0.129_0.042_264.695)] dark:via-[oklch(0.15_0.03_260)] dark:to-[oklch(0.129_0.042_264.695)]">
    
    <Background />

    <div class="w-full max-w-sm relative z-10">
        <div class="bg-card dark:bg-white/10 dark:backdrop-blur-md rounded-lg shadow-xl ring-1 ring-border dark:ring-white/20 overflow-hidden relative">
            <div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-primary/50"></div>
            <div class="px-8 py-10 sm:px-10 sm:py-12">
                <div class="text-center mb-8">
                    <Logo class="flex items-center justify-center gap-3 text-3xl mb-3" />
                    <p class="text-sm text-muted-foreground dark:text-white/60">
                        Введите свои данные для входа в систему
                    </p>
                </div>

                <form class="flex flex-col gap-5" use:enhance>
                    <FormField {form} name="email">
                        <FormControl>
                            {#snippet children({props})}
                                <FormLabel>email</FormLabel>
                                <Input type="email" placeholder="name@example.com" {...props} bind:value={$formData.email} />
                            {/snippet}
                        </FormControl>
                        <FormFieldErrors />
                    </FormField>
                    <FormField {form} name="password">
                        <FormControl>
                            {#snippet children({props})}
                                <FormLabel>пароль</FormLabel>
                                <PasswordInput placeholder="••••••••" {...props} bind:value={$formData.password} />
                            {/snippet}
                        </FormControl>
                        <FormFieldErrors />
                    </FormField>
                    <div class="mt-2">
                        <Button type="submit" class="w-full text-base" disabled={$submitting}>
                            {#if $submitting}
                                <span class="flex gap-1 justify-center">
                                    <span class="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></span>
                                    <span class="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.1s]"></span>
                                    <span class="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                </span>
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
