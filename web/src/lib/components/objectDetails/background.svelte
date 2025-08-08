<script lang="ts">
    import * as Dialog from '$lib/components/ui/dialog';
    import {Button, buttonVariants} from '$lib/components/ui/button';

    interface Props {
        isConfirmationRequired?: boolean;
        onClick(): void;
    }

    let {isConfirmationRequired = false, onClick}: Props = $props();
</script>

{#if isConfirmationRequired}
    <Dialog.Root>
        <Dialog.Trigger class="fixed inset-0 z-2 bg-transparent"></Dialog.Trigger>
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
    <div class="fixed inset-0 z-2 bg-transparent" onclick={onClick}></div>
{/if}
