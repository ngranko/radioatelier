<script lang="ts">
    import {onDestroy} from 'svelte';
    import type {LooseObject, PointPreviewDetails, SearchItem} from '$lib/interfaces/object.ts';
    import {setCreateDraftPosition} from '$lib/state/createDraft.svelte.js';
    import {
        objectDetailsOverlay,
        showPointCreateOverlay,
        showPointPreviewOverlay,
    } from '$lib/state/objectDetailsOverlay.svelte.js';
    import {searchPointList} from '$lib/state/searchPointList.svelte.ts';

    let {data} = $props();

    let lastActivePointId = $state<string | null>(null);

    function mergePreview(
        preview: PointPreviewDetails,
        searchItem?: SearchItem,
    ): PointPreviewDetails {
        if (!searchItem) {
            return preview;
        }

        return {
            ...preview,
            name: searchItem.name || preview.name,
            categoryName: searchItem.categoryName || preview.categoryName,
            address: searchItem.address || preview.address,
            city: searchItem.city || preview.city,
            country: searchItem.country || preview.country,
        };
    }

    function mergeDraft(
        draft: Partial<LooseObject>,
        preview: PointPreviewDetails,
    ): Partial<LooseObject> {
        return {
            ...draft,
            name: preview.name || draft.name,
            address: preview.address || draft.address,
            city: preview.city || draft.city,
            country: preview.country || draft.country,
        };
    }

    $effect(() => {
        const activePoint = data.activePoint;
        if (!activePoint) {
            return;
        }

        const isInitialSyncForPoint =
            lastActivePointId === null || lastActivePointId !== activePoint.id;
        if (
            objectDetailsOverlay.isDirty &&
            lastActivePointId !== null &&
            lastActivePointId === activePoint.id
        ) {
            return;
        }

        const shouldSyncOverlay = objectDetailsOverlay.isOpen || isInitialSyncForPoint;
        if (!shouldSyncOverlay) {
            return;
        }

        const searchItem = activePoint.preview.googlePlaceId
            ? searchPointList[activePoint.preview.googlePlaceId]?.object
            : undefined;
        const preview = mergePreview(activePoint.preview, searchItem);
        const draft = mergeDraft(activePoint.draft, preview);

        setCreateDraftPosition({
            lat: preview.latitude,
            lng: preview.longitude,
        });

        if (objectDetailsOverlay.mode === 'pointCreate') {
            showPointCreateOverlay(activePoint.id, draft, preview);
        } else {
            showPointPreviewOverlay(activePoint.id, draft, preview);
        }

        lastActivePointId = activePoint.id;
        objectDetailsOverlay.isDirty = false;
    });

    onDestroy(() => {
        setCreateDraftPosition(null);
    });
</script>
