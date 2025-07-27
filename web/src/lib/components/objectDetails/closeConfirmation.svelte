<script lang="ts">
    import Dialog from '$lib/components/dialog.svelte';
    import {Button} from '$lib/components/ui/button';

    interface Props {
        isOpen?: boolean;
        onClick(): void;
    }

    let {isOpen = $bindable(false), onClick}: Props = $props();

    function handleClose() {
        isOpen = false;
    }

    function handleConfirm() {
        handleClose();
        onClick();
    }
</script>

<Dialog {isOpen}>
    <div class="mb-2">Вы действительно хотите выйти из редактирования точки?</div>
    <div>Изменения не будут сохранены</div>
    <div class="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onclick={handleClose}>Отменить</Button>
        <Button
            variant="ghost"
            class="text-destructive hover:text-destructive"
            onclick={handleConfirm}
        >
            Закрыть
        </Button>
    </div>
</Dialog>
