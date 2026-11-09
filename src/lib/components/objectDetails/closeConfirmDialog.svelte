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
        title?: string;
        onConfirmClose(): void;
    }

    let {
        open = $bindable(),
        title = 'Вы действительно хотите выйти из редактирования точки?',
        onConfirmClose,
    }: Props = $props();
</script>

<AlertDialogRoot bind:open>
    <Content>
        <Header>
            <Title>{title}</Title>
            <Description>Изменения не будут сохранены</Description>
        </Header>
        <Footer>
            <Cancel>Продолжить редактирование</Cancel>
            <Action class="bg-destructive hover:bg-destructive/70" onclick={onConfirmClose}>
                Не сохранять
            </Action>
        </Footer>
    </Content>
</AlertDialogRoot>
