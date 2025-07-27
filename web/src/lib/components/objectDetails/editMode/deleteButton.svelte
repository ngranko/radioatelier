<script lang="ts">
    import {Button, buttonVariants} from '$lib/components/ui/button';
    import * as Dialog from '$lib/components/ui/dialog';
    import {clsx} from 'clsx';

    interface Props {
        onClick(): void;
    }

    let {onClick}: Props = $props();
</script>

<Dialog.Root>
    <Dialog.Trigger
        type="button"
        class={clsx([
            buttonVariants({variant: 'ghost'}),
            'text-destructive hover:text-destructive',
        ])}
    >
        Удалить
    </Dialog.Trigger>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>Вы действительно хотите удалить точку?</Dialog.Title>
            <Dialog.Description>Это действие нельзя отменить</Dialog.Description>
        </Dialog.Header>
        <Dialog.Footer>
            <Dialog.Close>
                <Button variant="ghost">Отменить</Button>
            </Dialog.Close>
            <Button
                variant="ghost"
                class="text-destructive hover:text-destructive"
                onclick={onClick}
            >
                Удалить
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
