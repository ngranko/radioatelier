<script lang="ts">
    import {page} from '$app/state';
    import {objectDetailsOverlay} from '$lib/state/objectDetailsOverlay.svelte';

    const SITE_TITLE = 'Радиоателье. Архив';

    const isObjectOpen = $derived(
        objectDetailsOverlay.isOpen &&
            (objectDetailsOverlay.mode === 'objectView' ||
                objectDetailsOverlay.mode === 'objectEdit'),
    );
    // The overlay fills in only after hydration, so the server render — the one
    // link previews read — takes the object from the page data instead.
    const objectName = $derived<string | undefined>(
        isObjectOpen ? objectDetailsOverlay.details?.name : page.data.activeObject?.name,
    );
</script>

<!-- owned here rather than per route: Svelte leaves document.title as it was when a
     page's own <title> unmounts, so closing an object would keep its name -->
<svelte:head>
    <title>{objectName ? `${objectName} — ${SITE_TITLE}` : SITE_TITLE}</title>
    <meta property="og:title" content={objectName || 'Радиоателье'} />
</svelte:head>
