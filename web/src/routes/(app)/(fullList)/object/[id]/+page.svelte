<script lang="ts">
    import {activeObject} from '$lib/state/activeObject.svelte.ts';
    import {page} from '$app/state';
    import {pointList} from '$lib/stores/map.ts';
    import {onMount} from 'svelte';
    import type {PageProps} from './$types';

    let {data}: PageProps = $props();

    const id = page.params.id;

    onMount(() => {
        if (!data.activeObject) {
            return;
        }

        activeObject.detailsId = id;
        activeObject.object = data.activeObject;
        if (!$pointList[data.activeObject.id]) {
            pointList.add({object: data.activeObject});
        }
    });
</script>
