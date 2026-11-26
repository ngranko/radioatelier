<script lang="ts">
    import {api} from '$convex/_generated/api';
    import {trackArrivals} from '$lib/services/photoCapture/arrivals';
    import {refreshUnsentCaptures} from '$lib/state/photoCapture.svelte';
    import {useQuery} from 'convex-svelte';
    import posthog from 'posthog-js';
    import {onMount} from 'svelte';
    import {toast} from 'svelte-sonner';

    // Analyses finish on the server, possibly long after the photo was sent, so
    // their outcome is read off the live lists rather than awaited.
    const captures = useQuery(api.photoCaptures.list, {});
    const pending = useQuery(api.pendingReview.list, {});
    const takeNewObjects = trackArrivals<{id: string; name: string}>();
    const takeNewFailures = trackArrivals<{
        id: string;
        status: string;
        failureReason: string | null;
    }>(capture => capture.status === 'failed');

    onMount(refreshUnsentCaptures);

    $effect(() => {
        for (const object of pending.data ? takeNewObjects(pending.data) : []) {
            toast.info(`Добавлено: «${object.name}»`);
            posthog.capture('photo_capture_analyzed', {object_id: object.id});
        }
    });

    $effect(() => {
        for (const capture of captures.data ? takeNewFailures(captures.data) : []) {
            toast.error('Не удалось распознать фото');
            posthog.capture('photo_capture_failed', {reason: capture.failureReason});
        }
    });
</script>
