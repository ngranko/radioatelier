<script lang="ts">
    import {activeObject} from '$lib/state/activeObject.svelte.ts';
    import {page} from '$app/state';
    import {onMount} from 'svelte';
    import type {LayoutProps} from './$types';
    import {goto} from '$app/navigation';

    let {data, children}: LayoutProps = $props();

    const id = page.params.id;

    onMount(() => {
        if (!data.activeObject) {
            goto('/');
            return;
        }

        activeObject.detailsId = id;
        activeObject.object = data.activeObject;
    });
</script>

{@render children?.()}
