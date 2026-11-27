<script lang="ts">
    import {api} from '$convex/_generated/api';
    import Spinner from '$lib/components/spinner.svelte';
    import {submitPhotoCapture} from '$lib/services/photoCapture/submitCapture';
    import {photoCaptureState} from '$lib/state/photoCapture.svelte';
    import {countAvailableCaptures, PHOTO_CAPTURES_PER_HOUR} from '$lib/utils/photoCaptureQuota';
    import CameraIcon from '@lucide/svelte/icons/camera';
    import PlusIcon from '@lucide/svelte/icons/plus';
    import {useConvexClient, useQuery} from 'convex-svelte';
    import {toast} from 'svelte-sonner';

    const client = useConvexClient();
    const quota = useQuery(api.photoCaptures.getQuota, {});
    let input: HTMLInputElement | undefined = $state();

    // The limit is checked before the camera opens: a photo taken through the
    // browser never reaches the camera roll, so one that can't be sent is lost.
    function handleClick() {
        if (quota.data && !quota.data.isUnlimited && countAvailableCaptures(quota.data) < 1) {
            toast.info(`Лимит ${PHOTO_CAPTURES_PER_HOUR} фото в час исчерпан`);
            return;
        }
        input?.click();
    }

    async function handleChange() {
        const file = input?.files?.[0];
        if (input) {
            input.value = '';
        }
        if (file) {
            await submitPhotoCapture(client, file);
        }
    }
</script>

<!-- Mobile only: the feature is for adding things on the go, where the camera is. -->
<button
    type="button"
    class="glass text-foreground absolute bottom-6 left-2.5 z-1 hidden size-11 place-items-center rounded-full bg-white/90 shadow-sm transition-all active:scale-[0.97] disabled:active:scale-100 dark:bg-white/10 pointer-coarse:grid"
    disabled={photoCaptureState.isSending}
    onclick={handleClick}
    aria-label="Добавить точку по фото"
    title="Добавить точку по фото"
>
    {#if photoCaptureState.isSending}
        <Spinner class="text-primary size-5" />
    {:else}
        <CameraIcon class="size-5" />
        <span
            class="bg-primary text-primary-foreground absolute right-1.5 bottom-1.5 grid size-3.5 place-items-center rounded-full ring-2 ring-white dark:ring-neutral-700"
        >
            <PlusIcon class="size-2.5" strokeWidth={4} />
        </span>
    {/if}
</button>
<input
    bind:this={input}
    type="file"
    accept="image/*"
    capture="environment"
    class="hidden"
    onchange={handleChange}
/>
