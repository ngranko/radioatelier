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
                class="group text-foreground hover:text-foreground relative z-2 size-11 rounded-full bg-white/90 text-lg shadow-lg ring-1 shadow-black/[0.1] ring-black/[0.06] backdrop-blur-xl transition-all hover:bg-white hover:shadow-xl active:scale-[0.97]"
                aria-label="Показать меню"
            >
                <AvatarRoot class="size-10 rounded-full bg-transparent">
                    <Fallback
                        class="text-foreground rounded-full bg-transparent text-lg transition-transform group-hover:scale-110"
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
