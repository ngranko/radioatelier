<script lang="ts">
    import {
        Root as AlertDialogRoot,
        Content,
        Header,
        Title,
        Footer,
        Cancel,
        Action,
    } from '$lib/components/ui/alert-dialog';
    import {clearSearchPointList} from '$lib/state/searchPointList.svelte.ts';
    import {resetActiveObject} from '$lib/state/activeObject.svelte.ts';
    import {clearSharedMarker} from '$lib/state/sharedMarker.svelte.ts';
    import {useClerkContext} from 'svelte-clerk';
    import {toast} from 'svelte-sonner';
    import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';

    interface Props {
        isOpen: boolean;
    }

    let {isOpen = $bindable()}: Props = $props();

    const ctx = useClerkContext();
    let isLoggingOut = $state(false);

    async function handleClick() {
        if (!ctx.clerk || !ctx.isLoaded) {
            toast.error('Система авторизации загружается...');
            return;
        }

        isLoggingOut = true;

        try {
            // might cause issues if the logout call fails (because we already cleaned everything up)
            // TODO: fix sometime in the future when I have nothing else to do
            resetActiveObject();
            clearSearchPointList();
            clearSharedMarker();
            localStorage.removeItem('lastCenter');
            localStorage.removeItem('lastPosition');

            await ctx.clerk.signOut({redirectUrl: '/login'});
        } catch (err) {
            console.error('Failed to logout', err);
            toast.error('Не удалось выйти из аккаунта');
            isLoggingOut = false;
        }
    }

    function getIsOpen() {
        return isOpen;
    }

    function setIsOpen(newOpen: boolean) {
        isOpen = newOpen;
    }
</script>

<!-- prettier-ignore -->
<AlertDialogRoot bind:open={getIsOpen, setIsOpen}>
    <Content>
        <Header>
            <Title>Вы действительно хотите выйти?</Title>
        </Header>
        <Footer>
            <Cancel disabled={isLoggingOut}>Отмена</Cancel>
            <Action onclick={handleClick} disabled={isLoggingOut}>
                {#if isLoggingOut}
                    <LoaderCircleIcon class="animate-spin" />
                {:else}
                    Выйти
                {/if}
            </Action>
        </Footer>
    </Content>
</AlertDialogRoot>
