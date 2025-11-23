<script lang="ts">
    import {Root as AvatarRoot, Fallback} from '$lib/components/ui/avatar';
    import {Button} from '$lib/components/ui/button';
    import {
        Root as DropdownMenuRoot,
        Trigger as DropdownMenuTrigger,
        Content as DropdownMenuContent,
        Group,
        Separator as DropdownMenuSeparator,
        Item as DropdownMenuItem,
    } from '$lib/components/ui/dropdown-menu';
    import {toast} from 'svelte-sonner';
    import type {Component} from 'svelte';
    import LogoutDialog from '$lib/components/userMenu/logoutDialog.svelte';
    import {cubicInOut} from 'svelte/easing';
    import Loader from '$lib/components/loader.svelte';
    import {fade} from 'svelte/transition';
    import {goto} from '$app/navigation';

    let isChangePasswordDialogOpen = $state(false);
    let isLogoutDialogOpen = $state(false);
    let isDialogLoading = $state(false);
    let PasswordChangeDialog: Component<{isOpen: boolean}> | undefined = $state();

    function handleImportClick() {
        goto('/import');
    }

    async function handleChangePasswordClick() {
        isChangePasswordDialogOpen = true;
        if (!PasswordChangeDialog) {
            isDialogLoading = true;
            try {
                const {default: Component} = await import(
                    '$lib/components/userMenu/passwordChangeDialog.svelte'
                );
                PasswordChangeDialog = Component;
            } catch (error) {
                toast.error('Что-то пошло не так');
            }
            isDialogLoading = false;
        }
    }

    function handleLogoutClick() {
        isLogoutDialogOpen = true;
    }
</script>

<DropdownMenuRoot>
    <DropdownMenuTrigger>
        <Button
            variant="ghost"
            size="icon"
            class="relative z-2 m-2 size-10 rounded-full text-3xl shadow-lg"
            aria-label="Показать меню"
        >
            <AvatarRoot class="size-10 rounded-full">
                <Fallback
                    class="bg-primary items-end rounded-full pt-1 pr-1 pl-1 brightness-200 saturate-25 transition hover:brightness-180 hover:saturate-30"
                >
                    <i class="fa-solid fa-user-ninja"></i>
                </Fallback>
            </AvatarRoot>
        </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="mr-4">
        <Group>
            <DropdownMenuItem onclick={handleImportClick}>
                <i class="fa-solid fa-file-import"></i>
                Импорт точек
            </DropdownMenuItem>
            <DropdownMenuItem onclick={handleChangePasswordClick}>
                <i class="fa-solid fa-key"></i>
                Сменить пароль
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onclick={handleLogoutClick}>
                <i class="fa-solid fa-right-from-bracket"></i>
                Выйти
            </DropdownMenuItem>
        </Group>
    </DropdownMenuContent>
</DropdownMenuRoot>

{#if isDialogLoading}
    <div
        class="fixed inset-0 z-2 flex items-center justify-center bg-black/30"
        transition:fade={{duration: 100, easing: cubicInOut}}
    >
        <Loader />
    </div>
{/if}

{#if PasswordChangeDialog}
    <PasswordChangeDialog bind:isOpen={isChangePasswordDialogOpen} />
{/if}

<LogoutDialog bind:isOpen={isLogoutDialogOpen} />
