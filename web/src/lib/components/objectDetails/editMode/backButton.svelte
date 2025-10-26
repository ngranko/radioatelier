<script lang="ts">
    import * as AlertDialog from '$lib/components/ui/alert-dialog';
    import {Button, buttonVariants} from '$lib/components/ui/button';

    interface Props {
        isConfirmationRequired?: boolean;
        onClick(): void;
    }

    let {isConfirmationRequired = false, onClick}: Props = $props();
</script>

{#if isConfirmationRequired}
    <AlertDialog.Root>
        <AlertDialog.Trigger type="button" class={buttonVariants({variant: 'ghost'})}>
            Назад
        </AlertDialog.Trigger>
        <AlertDialog.Content>
            <AlertDialog.Header>
                <AlertDialog.Title>
                    Вы действительно хотите выйти из редактирования точки?
                </AlertDialog.Title>
                <AlertDialog.Description>Изменения не будут сохранены</AlertDialog.Description>
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
    <Button variant="ghost" onclick={onClick}>Назад</Button>
{/if}
