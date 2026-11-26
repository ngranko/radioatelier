<script lang="ts">
    import {
        Action,
        Root as AlertDialogRoot,
        Cancel,
        Content,
        Description,
        Footer,
        Header,
        Title,
    } from '$lib/components/ui/alert-dialog';

    interface Props {
        open: boolean;
        onConfirm(): void;
    }

    let {open = $bindable(), onConfirm}: Props = $props();
</script>

<AlertDialogRoot bind:open>
    <Content>
        <Header>
            <Title>Удалить фото?</Title>
            <Description>Это действие нельзя отменить</Description>
        </Header>
        <Footer>
            <Cancel>Отменить</Cancel>
            <Action class="bg-destructive hover:bg-destructive/70" onclick={onConfirm}>
                Удалить
            </Action>
        </Footer>
    </Content>
</AlertDialogRoot>
