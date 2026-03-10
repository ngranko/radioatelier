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
    import LogoutDialog from '$lib/components/userMenu/logoutDialog.svelte';
    import {goto} from '$app/navigation';

    let isLogoutDialogOpen = $state(false);

    function handleImportClick() {
        goto('/import');
    }

    function handleChangePasswordClick() {
        goto('/change-password');
    }

    function handleLogoutClick() {
        isLogoutDialogOpen = true;
    }
</script>

<DropdownMenuRoot>
    <DropdownMenuTrigger>
        {#snippet child({props})}
            <Button
                {...props}
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
        {/snippet}
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

<LogoutDialog bind:isOpen={isLogoutDialogOpen} />
