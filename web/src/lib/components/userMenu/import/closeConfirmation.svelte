<script lang="ts">
    import * as AlertDialog from '$lib/components/ui/alert-dialog';
    import {ImportStepProgress} from '$lib/interfaces/import.ts';
    import {importState} from '$lib/state/import.svelte.ts';

    interface Props {
        isOpen?: boolean;
        onClick(): void;
    }

    let {isOpen = $bindable(false), onClick}: Props = $props();

    function getIsOpen() {
        return isOpen;
    }

    function setIsOpen(value: boolean) {
        isOpen = value;
    }

    function handleClick() {
        setIsOpen(false);
        onClick();
    }
</script>

<!-- prettier-ignore -->
<AlertDialog.Root bind:open={getIsOpen, setIsOpen}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Вы действительно хотите закрыть окно?</AlertDialog.Title>
            {#if importState.step === ImportStepProgress}
                <AlertDialog.Description>Текущий импорт будет отменен, но уже обработанные точки не будут удалены</AlertDialog.Description>
            {/if}
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel>Остаться</AlertDialog.Cancel>
            <AlertDialog.Action onclick={handleClick} class="bg-destructive hover:bg-destructive/70">Закрыть</AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
