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
    import ThemeSwitcher from '$lib/components/themeSwitcher.svelte';
    import {goto} from '$app/navigation';
    import {page} from '$app/state';
    import LogInIcon from '@lucide/svelte/icons/log-in';
    import UserRoundXIcon from '@lucide/svelte/icons/user-round-x';

    function handleLoginClick() {
        goto(`/login?ref=${encodeURIComponent(page.url.pathname)}`);
    }
</script>

<DropdownMenuRoot>
    <DropdownMenuTrigger>
        {#snippet child({props})}
            <Button
                {...props}
                variant="ghost"
                size="icon"
                class="glass group text-foreground/50 hover:text-foreground/70 relative z-2 size-11 rounded-full bg-white/75 text-lg shadow-md transition-all hover:bg-white/90 hover:shadow-lg active:scale-[0.97] dark:bg-white/10 dark:shadow-black/30 dark:hover:bg-white/15"
                aria-label="Показать меню"
            >
                <AvatarRoot class="size-10 rounded-full bg-transparent">
                    <Fallback
                        class="text-foreground/50 group-hover:text-foreground/70 rounded-full bg-transparent transition-transform group-hover:scale-110"
                    >
                        <UserRoundXIcon class="size-5 translate-x-0.5" />
                    </Fallback>
                </AvatarRoot>
            </Button>
        {/snippet}
    </DropdownMenuTrigger>
    <DropdownMenuContent class="mr-4">
        <Group>
            <DropdownMenuItem onclick={handleLoginClick}>
                <LogInIcon />
                Войти
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div class="flex justify-center px-2 py-1.5">
                <ThemeSwitcher />
            </div>
        </Group>
    </DropdownMenuContent>
</DropdownMenuRoot>
