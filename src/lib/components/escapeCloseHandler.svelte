<script lang="ts">
    import {onMount} from 'svelte';
    import {dispatchEscapeClose} from '$lib/utils/escapeClose';

    onMount(() => {
        function onKeydown(event: KeyboardEvent) {
            if (event.key !== 'Escape') {
                return;
            }

            if (!dispatchEscapeClose()) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
        }

        window.addEventListener('keydown', onKeydown, true);

        return () => {
            window.removeEventListener('keydown', onKeydown, true);
        };
    });
</script>
