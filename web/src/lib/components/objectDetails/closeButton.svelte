<script lang="ts">
    import * as Dialog from '$lib/components/ui/dialog';
    import {Button, buttonVariants} from '$lib/components/ui/button';
    import {clsx} from 'clsx';

    interface Props {
        isConfirmationRequired?: boolean;
        onClick(): void;
    }

    let {isConfirmationRequired = false, onClick}: Props = $props();
</script>

{#if isConfirmationRequired}
    <Dialog.Root>
        <Dialog.Trigger
            type="button"
            class={clsx([
                buttonVariants({variant: 'ghost', size: 'icon'}),
                'h-8 w-8 text-lg hover:bg-gray-100',
            ])}
        >
            <i class="fa-solid fa-xmark"></i>
        </Dialog.Trigger>
        <Dialog.Content>
            <Dialog.Header>
                <Dialog.Title>Вы действительно хотите выйти из редактирования точки?</Dialog.Title>
                <Dialog.Description>Изменения не будут сохранены</Dialog.Description>
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
                    Закрыть
                </Button>
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>
{:else}
    <Button variant="ghost" size="icon" class="h-8 w-8 text-lg hover:bg-gray-100" onclick={onClick}>
        <i class="fa-solid fa-xmark"></i>
    </Button>
{/if}
