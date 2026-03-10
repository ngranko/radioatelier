<script lang="ts">
    import {fade} from 'svelte/transition';
    import {cubicInOut} from 'svelte/easing';
    import {Button} from '$lib/components/ui/button';
    import {cn} from '$lib/utils.ts';

    interface Props {
        button?: import('svelte').Snippet;
        children?: import('svelte').Snippet;
        class?: string;
    }

    let {button, children, class: className}: Props = $props();

    let isOpen = $state(false);

    function handleClick(event: Event) {
        event.stopPropagation();
        isOpen = !isOpen;
        if (isOpen) {
            window.addEventListener('click', handleClick);
        } else {
            window.removeEventListener('click', handleClick);
        }
    }
</script>

<div class={cn(['relative', {[className!]: className}])}>
    <Button variant="ghost" size="icon" class="button h-6 w-6 text-base" onclick={handleClick}>
        {@render button?.()}
    </Button>
    {#if isOpen}
        <div
            class="absolute top-1/2 -left-3 w-max max-w-61 transform-[translate(-100%,-50%)] rounded-sm border border-b-gray-300 bg-white pt-2 pr-3 pb-2 pl-3 text-start text-sm before:absolute before:top-1/2 before:-right-px before:block before:h-3 before:w-3 before:origin-center before:transform-[translate(50%,-50%)rotate(45deg)] before:rounded-tr-xs before:border before:border-b-0 before:border-l-0 before:border-gray-300 before:bg-white before:content-['']"
            transition:fade={{duration: 100, easing: cubicInOut}}
        >
            {@render children?.()}
        </div>
    {/if}
</div>
