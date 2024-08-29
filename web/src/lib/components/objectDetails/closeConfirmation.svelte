<script>
    import TextButton from '$lib/components/button/textButton.svelte';
    import Dialog from '$lib/components/dialog.svelte';
    import {createEventDispatcher} from 'svelte';

    const dispatch = createEventDispatcher();

    export let isOpen = false;

    function handleCancel() {
        isOpen = false;
    }

    function handleConfirm() {
        handleCancel();
        dispatch('click');
    }
</script>

<Dialog {isOpen}>
    <p>Вы действительно хотите выйти из редактирования точки?</p>
    <p>Изменения не будут сохранены</p>
    <div class="actions">
        <TextButton type="button" on:click={handleCancel}>Отменить</TextButton>
        <span class="close">
            <TextButton type="button" modifier="danger" on:click={handleConfirm}>
                Закрыть
            </TextButton>
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
