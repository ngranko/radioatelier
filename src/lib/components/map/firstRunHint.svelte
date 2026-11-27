<script lang="ts">
    import MapHint from '$lib/components/map/mapHint.svelte';
    import MapPinPlusIcon from '@lucide/svelte/icons/map-pin-plus';
    import {onMount} from 'svelte';

    const STORAGE_KEY = 'firstRunHintDismissed';

    // start hidden so the chip never flashes for users who dismissed it before
    let isDismissed = $state(true);

    onMount(() => {
        isDismissed = localStorage.getItem(STORAGE_KEY) === 'true';
    });

    function dismiss() {
        isDismissed = true;
        localStorage.setItem(STORAGE_KEY, 'true');
    }
</script>

{#if !isDismissed}
    <MapHint
        icon={MapPinPlusIcon}
        text="Нажмите на карту, чтобы добавить точку"
        dismissLabel="Скрыть подсказку"
        onDismiss={dismiss}
    />
{/if}
