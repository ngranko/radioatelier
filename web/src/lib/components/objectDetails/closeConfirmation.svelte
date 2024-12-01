<script lang="ts">
    import TextButton from '$lib/components/button/textButton.svelte';
    import Dialog from '$lib/components/dialog.svelte';

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
    <p>Вы действительно хотите выйти из редактирования точки?</p>
    <p>Изменения не будут сохранены</p>
    <div class="actions">
        <TextButton type="button" onClick={handleClose}>Отменить</TextButton>
        <span class="close">
            <TextButton type="button" modifier="danger" onClick={handleConfirm}>Закрыть</TextButton>
        </span>
    </div>
</Dialog>

<style lang="scss">
    .actions {
        display: flex;
        justify-content: flex-end;
    }

    .close {
        margin-left: 8px;
    }
</style>
