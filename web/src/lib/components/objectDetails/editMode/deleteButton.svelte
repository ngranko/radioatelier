<script lang="ts">
    import {buttonVariants} from '$lib/components/ui/button';
    import * as AlertDialog from '$lib/components/ui/alert-dialog';
    import {cn} from '$lib/utils.ts';

    interface Props {
        onClick(): void;
    }

    let {onClick}: Props = $props();
</script>

<AlertDialog.Root>
    <AlertDialog.Trigger
        type="button"
        class={cn([buttonVariants({variant: 'ghost'}), 'text-destructive hover:text-destructive'])}
    >
        Удалить
    </AlertDialog.Trigger>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Вы действительно хотите удалить точку?</AlertDialog.Title>
            <AlertDialog.Description>Это действие нельзя отменить</AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel>Отменить</AlertDialog.Cancel>
            <AlertDialog.Action class="bg-destructive hover:bg-destructive/70" onclick={onClick}>
                Удалить
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
