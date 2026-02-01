<script lang="ts">
    import {page} from '$app/state';
    import {goto} from '$app/navigation';
    import {activeObject, resetActiveObject} from '$lib/state/activeObject.svelte.ts';
    import type {Object} from '$lib/interfaces/object.ts';
    import type {LayoutProps} from './$types';

    let {data, children}: LayoutProps = $props();

    // Handle SSR data (immediately available)
    $effect(() => {
        if (data.activeObject) {
            activeObject.detailsId = page.params.id;
            activeObject.object = data.activeObject;
            activeObject.isEditing = data.isEditPage ?? false;
            activeObject.isLoading = false;
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dataWithPromise = data as unknown as {activeObjectPromise?: Promise<Object>};
        if (dataWithPromise.activeObjectPromise) {
            activeObject.detailsId = page.params.id;
            activeObject.isEditing = data.isEditPage ?? false;
            activeObject.isLoading = true;
            activeObject.object = null;

            dataWithPromise.activeObjectPromise
                .then((obj: Object) => {
                    activeObject.object = obj;
                    activeObject.isLoading = false;
                })
                .catch(() => {
                    // TODO: probably better to just show an error, not redirect
                    goto('/');
                });
            return;
        }

        resetActiveObject();
    });
</script>

{@render children?.()}
