<script lang="ts">
    import {Button, buttonVariants} from '$lib/components/ui/button';
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
            <AlertDialog.Close>
                <Button variant="ghost">Отменить</Button>
            </AlertDialog.Close>
            <Button
                variant="ghost"
                class="text-destructive hover:text-destructive"
                onclick={onClick}
            >
                Удалить
            </Button>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
