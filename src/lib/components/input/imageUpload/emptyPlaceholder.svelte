<script lang="ts">
    import LogoMark from '$lib/components/branding/logoMark.svelte';
    import {cn} from '$lib/utils.ts';

    interface Props {
        class?: string;
    }

    let {class: className}: Props = $props();
</script>

<div
    class={cn(
        'bg-muted relative flex aspect-2/1 w-full items-center justify-center overflow-hidden',
        className,
    )}
>
    <div class="text-foreground/70 dark:text-foreground/80">
        <LogoMark class="h-12" />
    </div>
</div>
