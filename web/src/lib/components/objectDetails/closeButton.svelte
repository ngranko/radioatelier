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
                <AlertDialog.Title>
                    Вы действительно хотите выйти из редактирования точки?
                </AlertDialog.Title>
                <AlertDialog.Description>Изменения не будут сохранены</AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
                <AlertDialog.Cancel>Отменить</AlertDialog.Cancel>
                <AlertDialog.Action
                    class="bg-destructive hover:bg-destructive/70"
                    onclick={onClick}
                >
                    Закрыть
                </AlertDialog.Action>
            </AlertDialog.Footer>
        </AlertDialog.Content>
    </AlertDialog.Root>
{:else}
    <Button variant="ghost" size="icon" class="h-8 w-8 text-lg hover:bg-gray-100" onclick={onClick}>
        <i class="fa-solid fa-xmark"></i>
    </Button>
{/if}
