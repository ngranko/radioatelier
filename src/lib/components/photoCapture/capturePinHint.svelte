<script lang="ts">
    import MapHint from '$lib/components/map/mapHint.svelte';
    import {resolveCapturePin} from '$lib/state/photoCapture.svelte';
    import MapPinIcon from '@lucide/svelte/icons/map-pin';
</script>

<MapHint
    icon={MapPinIcon}
    text="Нажмите на карту, где сделано фото"
    dismissLabel="Отменить отправку фото"
    onDismiss={() => resolveCapturePin(null)}
/>
