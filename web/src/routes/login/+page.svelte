<script lang="ts">
    import {useQueryClient} from '@tanstack/svelte-query';
    import {superForm} from 'sveltekit-superforms';
    import {zod4Client} from 'sveltekit-superforms/adapters';
    import {toast} from 'svelte-sonner';
    import {Button} from '$lib/components/ui/button';
    import Logo from './logo.svelte';
    import {FormField, FormControl, FormLabel, FormFieldErrors} from '$lib/components/ui/form';
    import {Input} from '$lib/components/ui/input';
    import PasswordInput from '$lib/components/input/passwordInput.svelte';
    import Background from './background.svelte';
    import type {PageData} from './$types';
    import {loginSchema} from './schema';

    let {data}: {data: PageData} = $props();

    const queryClient = useQueryClient();

    const form = superForm(data.form, {
        validators: zod4Client(loginSchema),
        onResult: ({result}) => {
            // Clear Tanstack Query cache on successful login (redirect means success)
            // TODO: remove after full ssr move
            if (result.type === 'redirect') {
                queryClient.clear();
            }
        },
        onError: ({result}) => {
            toast.error(result.error?.message ?? 'Вход не удался');
        },
    });

    const {form: formData, enhance, submitting} = form;
</script>

<section
    class="from-muted via-background to-muted relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br p-6 dark:from-[oklch(0.129_0.042_264.695)] dark:via-[oklch(0.15_0.03_260)] dark:to-[oklch(0.129_0.042_264.695)]"
>
    <Background />

    <div class="relative z-10 w-full max-w-sm">
        <div
            class="bg-card ring-border relative overflow-hidden rounded-lg shadow-xl ring-1 shadow-black/5 dark:bg-white/10 dark:ring-white/20 dark:backdrop-blur-md dark:shadow-black/20 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
        >
            <div
                class="from-primary to-primary/50 absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r"
            ></div>
            <div class="px-8 py-10 sm:px-10 sm:py-12">
                <div class="mb-8 text-center">
                    <Logo class="mb-3 flex items-center justify-center gap-3 text-3xl" />
                </div>

                <form method="POST" class="flex flex-col gap-5" use:enhance>
                    <FormField {form} name="email">
                        <FormControl>
                            {#snippet children({props})}
                                <FormLabel>Email</FormLabel>
                                <Input
                                    type="email"
                                    placeholder="name@example.com"
                                    class="focus-visible:border-primary focus-visible:ring-primary/30"
                                    {...props}
                                    bind:value={$formData.email}
                                />
                            {/snippet}
                        </FormControl>
                        <FormFieldErrors />
                    </FormField>
                    <FormField {form} name="password">
                        <FormControl>
                            {#snippet children({props})}
                                <FormLabel>Пароль</FormLabel>
                                <PasswordInput
                                    placeholder="••••••••"
                                    class="focus-visible:border-primary focus-visible:ring-primary/30"
                                    {...props}
                                    bind:value={$formData.password}
                                />
                            {/snippet}
                        </FormControl>
                        <FormFieldErrors />
                    </FormField>
                    <div class="mt-2">
                        <Button type="submit" class="w-full text-base" disabled={$submitting}>
                            {#if $submitting}
                                <span class="flex justify-center gap-1">
                                    <span
                                        class="h-1.5 w-1.5 animate-bounce rounded-full bg-current"
                                    ></span>
                                    <span
                                        class="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0.1s]"
                                    ></span>
                                    <span
                                        class="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0.2s]"
                                    ></span>
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
