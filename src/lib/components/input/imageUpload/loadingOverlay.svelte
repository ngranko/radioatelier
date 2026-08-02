<script lang="ts">
    import Spinner from '$lib/components/spinner.svelte';
    import {fade, scale} from 'svelte/transition';
</script>

<div
    class="absolute inset-0 z-30 flex items-center justify-center bg-black/45 backdrop-blur-[1px]"
    in:fade={{duration: 180}}
    out:fade={{duration: 220}}
>
    <div
        class="flex items-center gap-2 rounded-full border border-white/30 bg-black/30 px-3 py-1.5 text-sm font-medium text-white"
        in:scale={{duration: 200, start: 0.92}}
        out:scale={{duration: 160, start: 1}}
    >
        <Spinner />
        <span>Загрузка...</span>
    </div>
</div>
