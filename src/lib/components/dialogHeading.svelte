<script lang="ts">
    import {Title} from '$lib/components/ui/dialog';
    import {cn} from '$lib/utils.js';
    import type {Component} from 'svelte';

    interface Props {
        icon: Component<{class?: string}>;
        title?: string;
        hint?: string;
        class?: string;
    }

    let {icon: Icon, title, hint, class: className}: Props = $props();
</script>

<div
    class="from-primary via-primary/60 absolute inset-x-0 top-0 h-0.5 bg-linear-to-r to-transparent"
></div>
<div class={cn('relative shrink-0 px-6 pt-4 pb-3 sm:pt-6 sm:pb-4', className)}>
    <div
        class="from-primary/[0.07] via-primary/3 absolute inset-0 bg-linear-to-br to-transparent"
    ></div>
    <div class="relative flex items-center gap-3 pr-6 sm:gap-3.5">
        <div
            class="bg-primary/10 ring-primary/20 flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 sm:size-10 sm:rounded-xl"
        >
            <Icon class="text-primary size-4 sm:size-4.5" />
        </div>
        <div>
            <Title class="min-h-7 text-lg font-semibold tracking-[-0.01em]">{title}</Title>
            <p
                class="text-muted-foreground mt-0.5 min-h-4 text-xs/snug text-balance sm:min-h-5 sm:text-sm/snug"
            >
                {hint}
            </p>
        </div>
    </div>
</div>
