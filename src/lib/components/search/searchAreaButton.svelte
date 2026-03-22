<script lang="ts">
    import {fade} from 'svelte/transition';
    import {cubicInOut} from 'svelte/easing';
    import {searchState} from '$lib/components/search/search.svelte.ts';
    import {Button} from '$lib/components/ui/button';
    import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';

    interface Props {
        lat: string;
        lng: string;
    }

    const {lat, lng}: Props = $props();

    function handleClick() {
        searchState.lat = lat;
        searchState.lng = lng;
    }
</script>

<div
    class="fixed top-29 left-1/2 z-1 -translate-x-1/2 sm:top-2"
    transition:fade={{duration: 100, easing: cubicInOut}}
>
    <Button
        class="glass text-foreground rounded-full bg-white/90 text-sm transition-all duration-200 hover:bg-white hover:shadow-xl active:scale-[0.97] dark:bg-white/[0.1] dark:hover:bg-white/[0.15]"
        onclick={handleClick}
    >
        <RefreshCwIcon class="size-3.5" />
        Искать в этой области
    </Button>
</div>
