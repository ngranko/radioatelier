<script lang="ts">
    import LogoMark from '$lib/components/branding/logoMark.svelte';
    import {cn} from '$lib/utils.ts';

    interface Props {
        class?: string;
    }

    let {class: className}: Props = $props();
</script>

<div class={cn(['gap-3 text-3xl', className])}>
    <span class="text-foreground flex items-center" aria-hidden="true">
        <LogoMark class="h-7" />
    </span>
    <span class="text-muted-foreground/40 font-light">.</span>
    <span class="text-foreground font-semibold tracking-tight">архив</span>
</div>
