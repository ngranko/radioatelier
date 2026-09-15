<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import {shareLink} from '$lib/utils/share';
    import Share2Icon from '@lucide/svelte/icons/share-2';
    import {toast} from 'svelte-sonner';

    interface Props {
        id: string;
        name?: string;
    }

    let {id, name}: Props = $props();

    async function handleShareClick() {
        const outcome = await shareLink({
            url: new URL(`/object/${id}`, window.location.origin).href,
            title: name,
        });

        if (outcome === 'copied') {
            toast.success('Ссылка скопирована');
        }

        if (outcome === 'failed') {
            toast.error('Не удалось поделиться');
        }
    }
</script>

<Button
    variant="ghost"
    size="icon"
    class="text-muted-foreground hover:text-foreground"
    onclick={handleShareClick}
    aria-label="Поделиться"
    title="Поделиться"
>
    <Share2Icon />
</Button>
