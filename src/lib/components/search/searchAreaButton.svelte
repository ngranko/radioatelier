<script lang="ts">
    import {fade} from 'svelte/transition';
    import {cubicInOut} from 'svelte/easing';
    import {searchState} from '$lib/components/search/search.svelte.ts';
    import {Button} from '$lib/components/ui/button';

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
        class="text-foreground rounded-full bg-white/90 shadow-lg ring-1 shadow-black/[0.1] ring-black/[0.06] backdrop-blur-xl transition-all duration-200 hover:bg-white hover:shadow-xl active:scale-[0.97]"
        onclick={handleClick}
    >
        <i class="fa-solid fa-rotate text-xs"></i>
        Искать в этой области
    </Button>
</div>
