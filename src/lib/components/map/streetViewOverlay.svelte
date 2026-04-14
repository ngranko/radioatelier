<script lang="ts">
    import {onDestroy} from 'svelte';
    import {cn} from '$lib/utils';
    import Button from '$lib/components/ui/button/button.svelte';
    import StreetViewMinimap from '$lib/components/map/streetViewMinimap.svelte';
    import XMarkIcon from '@lucide/svelte/icons/x';

    interface Props {
        panorama: google.maps.StreetViewPanorama | null;
    }

    let {panorama}: Props = $props();

    let isVisible = $state(false);

    let listeners: google.maps.MapsEventListener[] = [];

    let initialized = false;
    $effect(() => {
        if (panorama && !initialized) {
            attachPanorama();
            initialized = true;
        }
    });

    function syncFromPanorama() {
        if (!panorama) {
            return;
        }

        isVisible = panorama.getVisible();
    }

    function cleanupListeners() {
        for (const l of listeners) {
            l.remove();
        }
        listeners = [];
    }

    function attachPanorama() {
        if (!panorama) {
            return;
        }

        syncFromPanorama();
        cleanupListeners();

        listeners.push(
            panorama.addListener('visible_changed', () => {
                syncFromPanorama();
            }),
        );
    }

    function exitStreetView() {
        if (panorama) {
            panorama.setVisible(false);
        }
    }

    onDestroy(() => {
        cleanupListeners();
    });
</script>

<div class={cn(['pointer-events-none absolute inset-0 z-1', {hidden: !isVisible}])}>
    <Button
        variant="secondary"
        size="icon"
        class="pointer-events-auto absolute top-4 right-4 shadow-[0_2px_10px_rgba(0,0,0,0.2)]"
        onclick={exitStreetView}
    >
        <XMarkIcon class="stroke-3" />
    </Button>

    <StreetViewMinimap {panorama} visible={isVisible} />
</div>
