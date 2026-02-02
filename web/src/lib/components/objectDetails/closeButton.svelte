<script lang="ts">
    import {
        Root as AlertDialogRoot,
        Trigger,
        Content,
        Header,
        Title,
        Description,
        Footer,
        Cancel,
        Action,
    } from '$lib/components/ui/alert-dialog';
    import {Button, buttonVariants} from '$lib/components/ui/button';
    import {cn} from '$lib/utils.ts';

    interface Props {
        isConfirmationRequired?: boolean;
        onClick(): void;
    }

    let {isConfirmationRequired = false, onClick}: Props = $props();
</script>

{#if isConfirmationRequired}
    <AlertDialogRoot>
        <Trigger
            type="button"
            class={cn([
                buttonVariants({variant: 'ghost', size: 'icon'}),
                'h-8 w-8 text-lg hover:bg-gray-100',
            ])}
        >
            <i class="fa-solid fa-xmark"></i>
        </Trigger>
        <Content>
            <Header>
                <Title>Вы действительно хотите выйти из редактирования точки?</Title>
                <Description>Изменения не будут сохранены</Description>
            </Header>
            <Footer>
                <Cancel>Отменить</Cancel>
                <Action class="bg-destructive hover:bg-destructive/70" onclick={onClick}>
                    Закрыть
                </Action>
            </Footer>
        </Content>
    </AlertDialogRoot>
{:else}
    <Button variant="ghost" size="icon" class="h-8 w-8 text-lg hover:bg-gray-100" onclick={onClick}>
        <i class="fa-solid fa-xmark"></i>
    </Button>
{/if}
