<script lang="ts">
    import * as Avatar from '$lib/components/ui/avatar';
    import {Button} from '$lib/components/ui/button';
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
    import {DropdownMenuItem} from '$lib/components/ui/dropdown-menu';
    import toast from 'svelte-5-french-toast';
    import type {Component} from 'svelte';
    import LogoutDialog from '$lib/components/userMenu/logoutDialog.svelte';
    import {cubicInOut} from 'svelte/easing';
    import Loader from '$lib/components/loader.svelte';
    import {fade} from 'svelte/transition';
    import ImportDialog from '$lib/components/userMenu/importDialog.svelte';

    let isImportDialogOpen = $state(false);
    let isChangePasswordDialogOpen = $state(false);
    let isLogoutDialogOpen = $state(false);
    let isDialogLoading = $state(false);
    let PasswordChangeDialog: Component<{isOpen: boolean}> | undefined = $state();

    function handleImportClick() {
        isImportDialogOpen = true;
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

<DropdownMenu.Root>
    <DropdownMenu.Trigger>
        <Button
            variant="ghost"
            size="icon"
            class="relative z-2 m-2 size-10 rounded-full text-3xl"
            aria-label="Показать меню"
        >
            <Avatar.Root class="size-10 rounded-full">
                <Avatar.Fallback
                    class="bg-primary items-end rounded-full pt-1 pr-1 pl-1 brightness-200 saturate-25 transition hover:brightness-180 hover:saturate-30"
                >
                    <i class="fa-solid fa-user-ninja"></i>
                </Avatar.Fallback>
            </Avatar.Root>
        </Button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content class="mr-4">
        <DropdownMenu.Group>
            <DropdownMenu.Item onclick={handleImportClick}>
                <i class="fa-solid fa-file-import"></i>
                Импорт точек
            </DropdownMenu.Item>
            <DropdownMenuItem onclick={handleChangePasswordClick}>
                <i class="fa-solid fa-key"></i>
                Сменить пароль
            </DropdownMenuItem>
            <DropdownMenu.Separator />
            <DropdownMenu.Item onclick={handleLogoutClick}>
                <i class="fa-solid fa-sign-out-alt"></i>
                Выйти
            </DropdownMenu.Item>
        </DropdownMenu.Group>
    </DropdownMenu.Content>
</DropdownMenu.Root>

{#if isDialogLoading}
    <div
        class="fixed inset-0 z-2 flex items-center justify-center bg-black/30"
        transition:fade={{duration: 100, easing: cubicInOut}}
    >
        <Loader />
    </div>
{/if}

<ImportDialog bind:isOpen={isImportDialogOpen} />

{#if PasswordChangeDialog}
    <PasswordChangeDialog bind:isOpen={isChangePasswordDialogOpen} />
{/if}

<LogoutDialog bind:isOpen={isLogoutDialogOpen} />
