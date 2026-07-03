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

    interface Props {
        open: boolean;
        onConfirmClose(): void;
    }

    let {open = $bindable(), onConfirmClose}: Props = $props();
</script>

<AlertDialogRoot bind:open>
    <Content>
        <Header>
            <Title>Вы действительно хотите выйти из редактирования точки?</Title>
            <Description>Изменения не будут сохранены</Description>
        </Header>
        <Footer>
            <Cancel>Отменить</Cancel>
            <Action class="bg-destructive hover:bg-destructive/70" onclick={onConfirmClose}>
                Закрыть
            </Action>
        </Footer>
    </Content>
</AlertDialogRoot>
