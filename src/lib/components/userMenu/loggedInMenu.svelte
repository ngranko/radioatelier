<script lang="ts">
    import {goto} from '$app/navigation';
    import {api} from '$convex/_generated/api';
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
    import ThemeMenuRow from '$lib/components/userMenu/themeMenuRow.svelte';
    import {photoCaptureState} from '$lib/state/photoCapture.svelte';
    import FileInputIcon from '@lucide/svelte/icons/file-input';
    import KeyRoundIcon from '@lucide/svelte/icons/key-round';
    import ListChecksIcon from '@lucide/svelte/icons/list-checks';
    import LogOutIcon from '@lucide/svelte/icons/log-out';
    import PaletteIcon from '@lucide/svelte/icons/palette';
    import TagsIcon from '@lucide/svelte/icons/tags';
    import UserRoundIcon from '@lucide/svelte/icons/user-round';
    import {useQuery} from 'convex-svelte';

    let isLogoutDialogOpen = $state(false);

    const currentUser = useQuery(api.users.current, {});
    const pending = useQuery(api.pendingReview.list, {});
    const captures = useQuery(api.photoCaptures.list, {});
    const isAdmin = $derived(currentUser.data?.role === 'admin');
    // Everything on the review page that waits for the owner, not for the server.
    const reviewCount = $derived(
        (pending.data?.length ?? 0) +
            (captures.data?.filter(capture => capture.status === 'failed').length ?? 0) +
            photoCaptureState.unsent.length,
    );

    function handleReviewClick() {
        goto('/review');
    }

    function handleImportClick() {
        goto('/import');
    }

    function handleSettingsClick() {
        goto('/settings');
    }

    function handleTaxonomiesClick() {
        goto('/taxonomies');
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
                class="glass group text-foreground hover:text-foreground relative z-2 size-11 rounded-full bg-white/90 text-lg transition-all hover:bg-white hover:shadow-xl active:scale-[0.97] dark:bg-white/10 dark:shadow-black/30 dark:hover:bg-white/15"
                aria-label="Показать меню"
            >
                <AvatarRoot class="size-10 rounded-full bg-transparent">
                    <Fallback
                        class="text-foreground rounded-full bg-transparent text-lg transition-transform group-hover:scale-110"
                    >
                        <UserRoundIcon class="size-5" />
                    </Fallback>
                </AvatarRoot>
                {#if reviewCount > 0}
                    <span
                        class="absolute top-0.5 right-0.5 size-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-neutral-800"
                        aria-hidden="true"
                    ></span>
                {/if}
            </Button>
        {/snippet}
    </DropdownMenuTrigger>
    <DropdownMenuContent class="mr-4">
        <Group>
            <DropdownMenuItem onclick={handleReviewClick}>
                <ListChecksIcon />
                На проверке
                {#if reviewCount > 0}
                    <span
                        class="ml-auto grid h-4.5 min-w-4.5 place-items-center rounded-full bg-amber-500/15 px-1.5 text-[11px] font-semibold text-amber-800 tabular-nums dark:text-amber-300"
                    >
                        {reviewCount}
                    </span>
                {/if}
            </DropdownMenuItem>
            <DropdownMenuItem onclick={handleImportClick}>
                <FileInputIcon />
                Импорт точек
            </DropdownMenuItem>
            <DropdownMenuItem onclick={handleSettingsClick}>
                <PaletteIcon />
                Настройки категорий
            </DropdownMenuItem>
            <DropdownMenuItem onclick={handleTaxonomiesClick}>
                <TagsIcon />
                {isAdmin ? 'Категории и теги' : 'Приватные теги'}
            </DropdownMenuItem>
            <DropdownMenuItem onclick={handleChangePasswordClick}>
                <KeyRoundIcon />
                Сменить пароль
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <ThemeMenuRow />
            <DropdownMenuSeparator />
            <DropdownMenuItem onclick={handleLogoutClick}>
                <LogOutIcon />
                Выйти
            </DropdownMenuItem>
        </Group>
    </DropdownMenuContent>
</DropdownMenuRoot>

<LogoutDialog bind:isOpen={isLogoutDialogOpen} />
