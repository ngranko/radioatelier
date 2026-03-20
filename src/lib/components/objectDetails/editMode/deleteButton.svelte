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
        disabled?: boolean;
    }

    let {disabled = false}: Props = $props();
    let isOpen = $state(false);
    let deleteButton: HTMLButtonElement;

    function handleClick() {
        if (disabled) {
            return;
        }

        isOpen = false;
        setTimeout(() => {
            deleteButton.click();
        }, 150);
    }
</script>

<AlertDialogRoot bind:open={isOpen}>
    <Trigger
        type="button"
        {disabled}
        class={cn([buttonVariants({variant: 'ghost'}), 'text-destructive hover:text-destructive'])}
    >
        Удалить
    </Trigger>
    <button
        type="submit"
        formaction="?/delete"
        hidden
        bind:this={deleteButton}
        aria-label="Удалить"
        {disabled}
    ></button>
    <Content>
        <Header>
            <Title>Вы действительно хотите удалить точку?</Title>
            <Description>Это действие нельзя отменить</Description>
        </Header>
        <Footer>
            <Cancel>Отменить</Cancel>
            <Action
                class="bg-destructive hover:bg-destructive/70"
                onclick={handleClick}
                {disabled}
            >
                Удалить
            </Action>
        </Footer>
    </Content>
</AlertDialogRoot>
