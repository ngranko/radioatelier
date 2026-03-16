<script lang="ts">
    import {buttonVariants} from '$lib/components/ui/button';
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
    import {cn} from '$lib/utils.ts';

    interface Props {
        onClick(): void;
    }

    let {onClick}: Props = $props();
    let isOpen = $state(false);

    function handleClick() {
        isOpen = false;
        setTimeout(() => {
            onClick();
        }, 150);
    }
</script>

<AlertDialogRoot bind:open={isOpen}>
    <Trigger
        type="button"
        class={cn([buttonVariants({variant: 'ghost'}), 'text-destructive hover:text-destructive'])}
    >
        Удалить
    </Trigger>
    <Content>
        <Header>
            <Title>Вы действительно хотите удалить точку?</Title>
            <Description>Это действие нельзя отменить</Description>
        </Header>
        <Footer>
            <Cancel>Отменить</Cancel>
            <Action class="bg-destructive hover:bg-destructive/70" onclick={handleClick}>
                Удалить
            </Action>
        </Footer>
    </Content>
</AlertDialogRoot>
