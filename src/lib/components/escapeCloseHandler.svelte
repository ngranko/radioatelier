<script lang="ts">
    import {dispatchEscapeClose} from '$lib/utils/escapeClose';
    import {onMount} from 'svelte';

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
