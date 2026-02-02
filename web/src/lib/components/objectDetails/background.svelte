<script lang="ts">
    import {
        Root as DialogRoot,
        Trigger,
        Content,
        Header,
        Title,
        Description,
        Footer,
        Close,
    } from '$lib/components/ui/dialog';
    import {Button} from '$lib/components/ui/button';

    interface Props {
        isConfirmationRequired?: boolean;
        onClick(): void;
    }

    let {isConfirmationRequired = false, onClick}: Props = $props();
</script>

{#if isConfirmationRequired}
    <DialogRoot>
        <Trigger class="fixed inset-0 z-2 bg-transparent"></Trigger>
        <Content>
            <Header>
                <Title>Вы действительно хотите выйти из редактирования точки?</Title>
                <Description>Изменения не будут сохранены</Description>
            </Header>
            <Footer>
                <Close>
                    <Button variant="ghost">Отменить</Button>
                </Close>
                <Button
                    variant="ghost"
                    class="text-destructive hover:text-destructive"
                    onclick={onClick}
                >
                    Закрыть
                </Button>
            </Footer>
        </Content>
    </DialogRoot>
{:else}
    <div class="fixed inset-0 z-1 bg-transparent" onclick={onClick}></div>
{/if}
