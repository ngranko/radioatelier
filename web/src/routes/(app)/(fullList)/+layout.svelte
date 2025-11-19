<script lang="ts">
    import {onMount} from 'svelte';
    import {pointList} from '$lib/stores/map.ts';

    let {data, children} = $props();

    onMount(() => {
        data.objects.forEach(object => {
            if (!$pointList[object.id]) {
                pointList.add({object});
            }
        });
    });
</script>

{@render children?.()}
