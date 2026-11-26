<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import {sendCapture} from '$lib/services/photoCapture/sendCapture';
    import {
        forgetUnsentCapture,
        type UnsentCapture,
    } from '$lib/services/photoCapture/unsentCaptures';
    import {refreshUnsentCaptures} from '$lib/state/photoCapture.svelte';
    import {useConvexClient} from 'convex-svelte';
    import {toast} from 'svelte-sonner';
    import FailedCaptureRow from './failedCaptureRow.svelte';

    let {capture}: {capture: UnsentCapture} = $props();

    const client = useConvexClient();
    const imageUrl = $derived(URL.createObjectURL(capture.image));
    let isSending = $state(false);

    $effect(() => {
        const url = imageUrl;
        return () => URL.revokeObjectURL(url);
    });

    async function handleRetryClick() {
        isSending = true;
        try {
            await sendCapture(client, capture);
            await forgetUnsentCapture(capture.id);
            await refreshUnsentCaptures();
            toast.info('Фото отправлено на разбор');
        } catch (error) {
            console.error('Failed to resend the photo capture:', error);
            toast.error('Не удалось отправить фото');
        } finally {
            isSending = false;
        }
    }

    async function discard() {
        await forgetUnsentCapture(capture.id);
        await refreshUnsentCaptures();
    }
</script>

<FailedCaptureRow
    title="Не загружено"
    hint="Фото есть только на этом устройстве"
    {imageUrl}
    onDiscard={discard}
>
    {#snippet actions()}
        <Button
            size="sm"
            variant="outline"
            class="text-sm"
            loading={isSending}
            onclick={handleRetryClick}
        >
            Повторить
        </Button>
    {/snippet}
</FailedCaptureRow>
