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
                    <i class="fa-solid fa-user-slash"></i>
                </Fallback>
            </AvatarRoot>
        </Button>
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
