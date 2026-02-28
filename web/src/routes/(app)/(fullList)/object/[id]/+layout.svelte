<script lang="ts">
    import {page} from '$app/state';
    import {fly} from 'svelte/transition';
    import {cubicInOut} from 'svelte/easing';
    import {goto} from '$app/navigation';
    import {useQuery} from 'convex-svelte';
    import {api} from '$convex/_generated/api.js';
    import type {Id} from '$convex/_generated/dataModel';
    import {useClerkContext} from 'svelte-clerk';
    import {activeObject} from '$lib/state/activeObject.svelte.ts';
    import ObjectDetails from '$lib/components/objectDetails/objectDetails.svelte';
    import type {Object as ObjectType} from '$lib/interfaces/object.ts';

    let {data, children} = $props();

    const objectId = $derived(page.params.id as Id<'objects'>);
    const objectQuery = useQuery(api.objects.getDetails, () => ({id: objectId}), {
        initialData: (data as {activeObject?: ObjectType}).activeObject,
    });

    let overlayVisible = $state(true);

    const ctx = useClerkContext();
    const renderedObject = $derived((objectQuery.data ?? null) as ObjectType | null);
    const isLoading = $derived(objectQuery.isLoading);
    const isOwner = $derived(renderedObject?.isOwner ?? false);
    const isPublic = $derived(renderedObject?.isPublic ?? false);
    let skipIntroAnimation = $state(false);

    $effect(() => {
        activeObject.detailsId = objectId;
        activeObject.isLoading = isLoading;
        if (isLoading) {
            skipIntroAnimation = true;
        }
    });

    function handleCloseRequest() {
        overlayVisible = false;
    }

    const FLY_OUT = {x: -100, duration: 200, easing: cubicInOut};
</script>

{@render children?.()}

{#if !isLoading && renderedObject && overlayVisible}
    <div
        out:fly={FLY_OUT}
        onoutroend={() => goto('/')}
        class="absolute bottom-0 left-0 right-0 z-3"
    >
        <ObjectDetails
            key={renderedObject?.id ?? 'object-details'}
            initialValues={renderedObject}
            isEditing={activeObject.isEditing}
            isLoading={false}
            disableIntroAnimation={
                skipIntroAnimation || Boolean((data as {activeObject?: ObjectType}).activeObject)
            }
            onCloseRequest={handleCloseRequest}
            permissions={{
                canEditAll: Boolean(ctx.auth.userId) && (isOwner || !renderedObject),
                canEditPersonal: Boolean(ctx.auth.userId) && !isOwner && isPublic,
            }}
        />
    </div>
{/if}
