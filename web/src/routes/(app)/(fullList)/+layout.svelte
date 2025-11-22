<script lang="ts">
    import {onMount} from 'svelte';
    import {pointList} from '$lib/stores/map.ts';
    import {sharedMarker} from '$lib/state/sharedMarker.svelte.ts';

    let {data, children} = $props();

    onMount(() => {
        data.objects.forEach(object => {
            if (!$pointList[object.id]) {
                pointList.add({object});
            }

            if (sharedMarker.object && sharedMarker.object.id === object.id) {
                sharedMarker.object = undefined;
            }
        });
    });
</script>

{@render children?.()}
