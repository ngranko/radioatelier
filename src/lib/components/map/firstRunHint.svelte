<script lang="ts">
    import {onMount} from 'svelte';
    import {fly} from 'svelte/transition';
    import {cubicInOut} from 'svelte/easing';
    import MapPinPlusIcon from '@lucide/svelte/icons/map-pin-plus';
    import XIcon from '@lucide/svelte/icons/x';

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
    <div
        transition:fly={{y: 16, duration: 200, easing: cubicInOut}}
        class="pointer-events-none absolute right-4 bottom-8 left-4 z-2 flex justify-center"
    >
        <div
            class="bg-background/95 pointer-events-auto flex min-w-0 items-center gap-2 rounded-full py-2 pr-2 pl-4 shadow-lg ring-1 ring-black/[0.08] backdrop-blur-sm dark:ring-white/[0.12]"
        >
            <MapPinPlusIcon class="text-primary size-4 shrink-0" />
            <span class="text-foreground min-w-0 truncate text-sm">
                Нажмите на карту, чтобы добавить точку
            </span>
            <button
                type="button"
                class="hover:bg-muted shrink-0 rounded-full p-1 transition-colors"
                onclick={dismiss}
                aria-label="Скрыть подсказку"
            >
                <XIcon class="text-muted-foreground size-4" />
            </button>
        </div>
    </div>
{/if}
