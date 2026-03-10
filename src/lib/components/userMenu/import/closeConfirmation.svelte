<script lang="ts">
    import {
        Root as AlertDialogRoot,
        Content,
        Header,
        Title,
        Description,
        Footer,
        Cancel,
        Action,
    } from '$lib/components/ui/alert-dialog';
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
<AlertDialogRoot bind:open={getIsOpen, setIsOpen}>
    <Content>
        <Header>
            <Title>Вы действительно хотите закрыть окно?</Title>
            {#if importState.step === ImportStepProgress}
                <Description>Текущий импорт будет отменен, но уже обработанные точки не будут удалены</Description>
            {/if}
        </Header>
        <Footer>
            <Cancel>Остаться</Cancel>
            <Action onclick={handleClick} class="bg-destructive hover:bg-destructive/70">Закрыть</Action>
        </Footer>
    </Content>
</AlertDialogRoot>
