<script lang="ts">
    import {onMount} from 'svelte';
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

    onMount(() => {
        // let's try it in case android allows doing it
        toggleOrientation();
    });

    function toggleOrientation() {
        if (isEnabled) {
            isEnabled = false;
            return;
        }

        if (
            window.DeviceOrientationEvent &&
            typeof (window.DeviceOrientationEvent as unknown as DeviceOrientationEventMaybeExtended)
                .requestPermission === 'function'
        ) {
            (window.DeviceOrientationEvent as unknown as DeviceOrientationEventExtended)
                .requestPermission()
                .then(() => {
                    isEnabled = true;
                })
                .catch((error: unknown) => {
                    console.error('error while requesting DeviceOrientationEvent permission');
                    console.error(error);
                });
        } else {
            console.warn('DeviceOrientationEvent not supported');
        }
    }
</script>

<button
    class={cn([
        'bg-map-control align-center absolute right-2.5 bottom-30 z-1 flex w-10 justify-center rounded-xs border-0 p-2.5 shadow-md transition-colors',
        {
            'text-map-control-muted-foreground': !isEnabled,
            'text-map-control-active-foreground': isEnabled,
        },
    ])}
    onclick={toggleOrientation}
    aria-label="Toggle orientation"
>
    <CompassIcon class="size-5" />
</button>
