<script lang="ts">
    import {page} from '$app/state';
    import {activeObject, resetActiveObject} from '$lib/state/activeObject.svelte.ts';
    import type {LayoutProps} from './$types';

    let {data, children}: LayoutProps = $props();

    $effect(() => {
        if (data.activeObject) {
            activeObject.detailsId = page.params.id;
            activeObject.object = data.activeObject;
            activeObject.isEditing = data.isEditPage ?? false;
            return;
        }

        resetActiveObject();
    });
</script>

{@render children?.()}
