<script lang="ts">
    import Spinner from '$lib/components/spinner.svelte';
    import {cn} from '$lib/utils.ts';

    interface Props {
        class?: string;
    }

    let {class: className}: Props = $props();
</script>

<div
    class={cn(
        'text-muted-foreground pointer-events-none absolute inset-0 flex items-center justify-end pr-3',
        className,
    )}
>
    <Spinner class="size-3.5" />
</div>
