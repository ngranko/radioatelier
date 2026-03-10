<script lang="ts">
    import {cn} from '$lib/utils.ts';

    interface Props {
        class?: string;
    }

    let {class: className}: Props = $props();
</script>

<div class={cn(['gap-3 text-3xl', className])}>
    <img src="/logo.svg" class="h-9 drop-shadow-sm" alt="Radioatelier logo" />
    <span class="text-muted-foreground/40 font-light">.</span>
    <span class="text-foreground font-semibold tracking-tight">архив</span>
</div>
