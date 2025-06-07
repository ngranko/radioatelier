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
    class="fixed top-29 sm:top-2 left-1/2 transform-[translateX(-50%)] z-1"
    transition:fade={{duration: 200, easing: cubicInOut}}
>
    <Button variant="default" class="bg-sky-600 hover:bg-sky-500" onclick={handleClick}>
        Искать в этой области
    </Button>
</div>
