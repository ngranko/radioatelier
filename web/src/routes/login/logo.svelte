<script lang="ts">
    import {cn} from '$lib/utils.ts';

    interface Props {
        class?: string;
    }

    let {class: className}: Props = $props();
</script>

<div class={cn(['gap-3 text-3xl', className])}>
    <img src="/logo.svg" class="h-8" alt="logo" />
    <span class="text-muted-foreground font-light dark:text-white/40">.</span>
    <span class="font-semibold tracking-tight">архив</span>
</div>
