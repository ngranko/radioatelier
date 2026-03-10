<script lang="ts">
    import {onMount} from 'svelte';
    import {cn} from '$lib/utils.ts';

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
        'align-center absolute right-2.5 bottom-30 z-1 flex w-10 justify-center rounded-xs border-0 bg-white p-2.5 text-xl shadow-md transition-colors',
        {'text-gray-500': !isEnabled, 'text-primary': isEnabled},
    ])}
    onclick={toggleOrientation}
    aria-label="Toggle orientation"
>
    <i class="fa-solid fa-compass -mb-0.5 block"></i>
</button>
