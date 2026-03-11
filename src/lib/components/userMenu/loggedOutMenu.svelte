<script lang="ts">
    import {Root as AvatarRoot, Fallback} from '$lib/components/ui/avatar';
    import {Button} from '$lib/components/ui/button';
    import {
        Root as DropdownMenuRoot,
        Trigger as DropdownMenuTrigger,
        Content as DropdownMenuContent,
        Group,
        Item as DropdownMenuItem,
    } from '$lib/components/ui/dropdown-menu';
    import {goto} from '$app/navigation';
    import {page} from '$app/state';

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
                class="group text-foreground/50 hover:text-foreground/70 relative z-2 size-11 rounded-full bg-white/75 text-lg shadow-md ring-1 shadow-black/[0.08] ring-black/[0.05] backdrop-blur-xl transition-all hover:bg-white/90 hover:shadow-lg active:scale-[0.97]"
                aria-label="Показать меню"
            >
                <AvatarRoot class="size-11 rounded-full bg-transparent">
                    <Fallback
                        class="text-foreground/50 group-hover:text-foreground/70 rounded-full bg-transparent text-lg transition-all group-hover:scale-110"
                    >
                        <i class="fa-solid fa-user-slash"></i>
                    </Fallback>
                </AvatarRoot>
            </Button>
        {/snippet}
    </DropdownMenuTrigger>
    <DropdownMenuContent class="mr-4">
        <Group>
            <DropdownMenuItem onclick={handleLoginClick}>
                <i class="fa-solid fa-right-to-bracket"></i>
                Войти
            </DropdownMenuItem>
        </Group>
    </DropdownMenuContent>
</DropdownMenuRoot>
