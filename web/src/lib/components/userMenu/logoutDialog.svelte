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
    import {createMutation} from '@tanstack/svelte-query';
    import {invalidateToken} from '$lib/api/token.ts';
    import {searchPointList} from '$lib/stores/map.ts';
    import {logout} from '$lib/api/auth.ts';
    import {resetActiveObject} from '$lib/state/activeObject.svelte.ts';
    import {goto} from '$app/navigation';

    interface Props {
        isOpen: boolean;
    }

    let {isOpen = $bindable()}: Props = $props();

    const invalidateTokenMutation = createMutation({
        mutationFn: invalidateToken,
        onSuccess() {
            resetActiveObject();
            searchPointList.clear();
            localStorage.removeItem('lastCenter');
            localStorage.removeItem('lastPosition');
            goto('/login', {invalidateAll: true});
        },
    });
    const logoutMutation = createMutation({
        mutationFn: logout,
        onSuccess: () => {
            // TODO: maybe the other way around is better? Invalidate then logout?
            $invalidateTokenMutation.mutate();
        },
    });

    function handleClick() {
        $logoutMutation.mutate();
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
            <Cancel>Отмена</Cancel>
            <Action onclick={handleClick}>Выйти</Action>
        </Footer>
    </Content>
</AlertDialogRoot>
