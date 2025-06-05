<script lang="ts">
    import {fade} from 'svelte/transition';
    import {cubicInOut} from 'svelte/easing';

    let {onClick} = $props();
</script>

<button
    class="clear-button absolute right-0 top-1/2 mr-1.5 p-2 border-none text-xl transform-[translateY(-50%)] bg-transparent cursor-pointer"
    aria-label="Очистить"
    onclick={onClick}
    transition:fade={{duration: 200, easing: cubicInOut}}
>
    <i class="fa-solid fa-xmark block w-5"></i>
</button>
