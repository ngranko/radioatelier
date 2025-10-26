<script lang="ts">
    import * as AlertDialog from '$lib/components/ui/alert-dialog';
    import {Button, buttonVariants} from '$lib/components/ui/button';
    import {cn} from '$lib/utils.ts';

    interface Props {
        isConfirmationRequired?: boolean;
        onClick(): void;
    }

    let {isConfirmationRequired = false, onClick}: Props = $props();
</script>

{#if isConfirmationRequired}
    <AlertDialog.Root>
        <AlertDialog.Trigger
            type="button"
            class={cn([
                buttonVariants({variant: 'ghost', size: 'icon'}),
                'h-8 w-8 text-lg hover:bg-gray-100',
            ])}
        >
            <i class="fa-solid fa-xmark"></i>
        </AlertDialog.Trigger>
        <AlertDialog.Content>
            <AlertDialog.Header>
                <Dialog.Title>Вы действительно хотите выйти из редактирования точки?</Dialog.Title>
                <Dialog.Description>Изменения не будут сохранены</Dialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
                <AlertDialog.Close>
                    <Button variant="ghost">Отменить</Button>
                </AlertDialog.Close>
                <Button
                    variant="ghost"
                    class="text-destructive hover:text-destructive"
                    onclick={onClick}
                >
                    Закрыть
                </Button>
            </AlertDialog.Footer>
        </AlertDialog.Content>
    </AlertDialog.Root>
{:else}
    <Button variant="ghost" size="icon" class="h-8 w-8 text-lg hover:bg-gray-100" onclick={onClick}>
        <i class="fa-solid fa-xmark"></i>
    </Button>
{/if}
