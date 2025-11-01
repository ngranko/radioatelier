<script lang="ts">
    import {Root as AlertDialogRoot, Content, Header, Title, Footer, Cancel, Action} from '$lib/components/ui/alert-dialog';
    import {createMutation} from '@tanstack/svelte-query';
    import {invalidateToken} from '$lib/api/token.ts';
    import RefreshToken from '$lib/api/auth/refreshToken.ts';
    import {pointList, searchPointList} from '$lib/stores/map.ts';
    import {goto} from '$app/navigation';
    import {logout} from '$lib/api/auth.ts';
    import {resetActiveObject} from '$lib/state/activeObject.svelte.ts';

    interface Props {
        isOpen: boolean;
    }

    let {isOpen = $bindable()}: Props = $props();

    const invalidateTokenMutation = createMutation({
        mutationFn: invalidateToken,
        onSuccess() {
            RefreshToken.del();
            resetActiveObject();
            pointList.clear();
            searchPointList.clear();
            localStorage.removeItem('lastCenter');
            localStorage.removeItem('lastPosition');
            goto(`/login`);
        },
    });
    const logoutMutation = createMutation({
        mutationFn: logout,
        onSuccess: () => {
            $invalidateTokenMutation.mutate(RefreshToken.get() ?? '');
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
