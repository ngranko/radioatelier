<script lang="ts">
    import {mapState} from '$lib/state/map.svelte';

    interface Props {
        onRequestClose(): void;
    }

    let {onRequestClose}: Props = $props();
</script>

<button
    type="button"
    aria-label="Закрыть карточку точки"
    class="fixed inset-0 z-1 bg-transparent"
    class:pointer-events-none={mapState.streetViewVisible}
    onclick={onRequestClose}
></button>
