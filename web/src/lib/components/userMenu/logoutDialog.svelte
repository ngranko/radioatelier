<script lang="ts">
    import * as AlertDialog from '$lib/components/ui/alert-dialog';
    import {createMutation} from '@tanstack/svelte-query';
    import {invalidateToken} from '$lib/api/token.ts';
    import RefreshToken from '$lib/api/auth/refreshToken.ts';
    import {activeObjectInfo, pointList, searchPointList} from '$lib/stores/map.ts';
    import {goto} from '$app/navigation';
    import {logout} from '$lib/api/auth.ts';

    interface Props {
        isOpen: boolean;
    }

    let {isOpen = $bindable()}: Props = $props();

    const invalidateTokenMutation = createMutation({
        mutationFn: invalidateToken,
        onSuccess() {
            RefreshToken.del();
            activeObjectInfo.reset();
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
<AlertDialog.Root bind:open={getIsOpen, setIsOpen}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Вы действительно хотите выйти?</AlertDialog.Title>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel>Отмена</AlertDialog.Cancel>
            <AlertDialog.Action onclick={handleClick}>Выйти</AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
