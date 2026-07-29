<script lang="ts">
    import {cn} from '$lib/utils.js';
    import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';

    interface Props {
        class?: string;
    }

    let {class: className}: Props = $props();
</script>

<!-- transform-box defaults to view-box, so WebKit resolves transform-origin against the icon's
     24-unit viewBox: anything rendered smaller than 24px orbits instead of spinning in place -->
<LoaderCircleIcon class={cn('origin-center animate-spin [transform-box:border-box]', className)} />
