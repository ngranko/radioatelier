<script lang="ts">
    import {onMount} from 'svelte';
    import {toast} from 'svelte-sonner';
    import {cn} from '$lib/utils.ts';
    import CompassIcon from '@lucide/svelte/icons/compass';

    interface DeviceOrientationEventMaybeExtended extends DeviceOrientationEvent {
        requestPermission?(): Promise<'granted' | 'denied'>;
    }

    interface DeviceOrientationEventExtended extends DeviceOrientationEvent {
        requestPermission(): Promise<'granted' | 'denied'>;
    }

    interface Props {
        isEnabled: boolean;
    }

    let {isEnabled = $bindable(false)}: Props = $props();
    let isSupported = $state(false);

    function needsPermission() {
        return (
            typeof (window.DeviceOrientationEvent as unknown as DeviceOrientationEventMaybeExtended)
                .requestPermission === 'function'
        );
    }

    onMount(() => {
        // Desktop browsers expose DeviceOrientationEvent but have no compass,
        // so only show the button where a sensor is plausible: iOS (permission
        // API present) or a touch device.
        isSupported =
            Boolean(window.DeviceOrientationEvent) &&
            (needsPermission() || navigator.maxTouchPoints > 0);

        // let's try it in case android allows doing it
        if (isSupported) {
            enableOrientation(true);
        }
    });

    function toggleOrientation() {
        if (isEnabled) {
            isEnabled = false;
            return;
        }

        enableOrientation(false);
    }

    function enableOrientation(silent: boolean) {
        if (!needsPermission()) {
            isEnabled = true;
            return;
        }

        (window.DeviceOrientationEvent as unknown as DeviceOrientationEventExtended)
            .requestPermission()
            .then(result => {
                if (result === 'granted') {
                    isEnabled = true;
                } else if (!silent) {
                    toast.error('Нет доступа к ориентации устройства');
                }
            })
            .catch((error: unknown) => {
                // iOS rejects the automatic onMount attempt (no user gesture),
                // so only surface denials that come from an explicit tap
                if (!silent) {
                    toast.error('Нет доступа к ориентации устройства');
                    console.error(error);
                }
            });
    }
</script>

{#if isSupported}
    <button
        class={cn([
            'bg-map-control align-center absolute right-2.5 bottom-30 z-1 flex w-10 justify-center rounded-xs border-0 p-2.5 shadow-md transition-colors',
            {
                'text-map-control-muted-foreground': !isEnabled,
                'text-map-control-active-foreground': isEnabled,
            },
        ])}
        onclick={toggleOrientation}
        aria-label="Ориентация по компасу"
    >
        <CompassIcon class="size-5" />
    </button>
{/if}
