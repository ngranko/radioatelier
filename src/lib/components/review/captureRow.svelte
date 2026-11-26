<script lang="ts">
    import {goto} from '$app/navigation';
    import {api} from '$convex/_generated/api';
    import type {Id} from '$convex/_generated/dataModel';
    import {Button} from '$lib/components/ui/button';
    import {buildPointUrl} from '$lib/utils/pointRoute';
    import {useConvexClient} from 'convex-svelte';
    import {toast} from 'svelte-sonner';
    import {describeCaptureFailure, formatSentTime} from './captureFailures';
    import FailedCaptureRow from './failedCaptureRow.svelte';
    import ReviewThumbnail from './reviewThumbnail.svelte';

    interface Props {
        capture: {
            id: Id<'photoCaptures'>;
            status: 'processing' | 'failed';
            failureReason: string | null;
            canRetry: boolean;
            imageUrl: string | null;
            latitude: number;
            longitude: number;
            createdAt: number;
        };
    }

    let {capture}: Props = $props();

    const client = useConvexClient();
    let isRetrying = $state(false);

    async function handleRetryClick() {
        isRetrying = true;
        try {
            await client.mutation(api.photoCaptures.retry, {id: capture.id});
        } catch (error) {
            console.error('Failed to retry the photo capture:', error);
            toast.error('Не удалось повторить');
        } finally {
            isRetrying = false;
        }
    }

    function handleFillClick() {
        const {latitude, longitude, id} = capture;
        void goto(buildPointUrl({latitude, longitude, captureId: id}));
    }

    async function discard() {
        try {
            await client.mutation(api.photoCaptures.dismiss, {id: capture.id});
        } catch (error) {
            console.error('Failed to dismiss the photo capture:', error);
            toast.error('Не удалось удалить фото');
        }
    }
</script>

{#if capture.status === 'processing'}
    <div class="flex items-center gap-3 rounded-lg px-3 py-2">
        <ReviewThumbnail url={capture.imageUrl} isBusy />
        <div class="min-w-0 flex-1">
            <p class="text-muted-foreground text-sm font-medium">Распознаём фото…</p>
            <p class="text-muted-foreground mt-0.5 text-xs">
                Отправлено в {formatSentTime(capture.createdAt)}
            </p>
        </div>
    </div>
{:else}
    <FailedCaptureRow
        title="Не удалось распознать"
        hint={describeCaptureFailure(capture.failureReason)}
        imageUrl={capture.imageUrl}
        onDiscard={discard}
    >
        {#snippet actions()}
            {#if capture.canRetry}
                <Button
                    size="sm"
                    variant="outline"
                    class="text-sm"
                    loading={isRetrying}
                    onclick={handleRetryClick}
                >
                    Повторить
                </Button>
            {/if}
            <Button size="sm" variant="outline" class="text-sm" onclick={handleFillClick}>
                Заполнить вручную
            </Button>
        {/snippet}
    </FailedCaptureRow>
{/if}
