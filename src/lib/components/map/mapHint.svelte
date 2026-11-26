<script lang="ts">
    import {respectReducedMotion} from '$lib/utils/motion';
    import XIcon from '@lucide/svelte/icons/x';
    import type {Component} from 'svelte';
    import {cubicInOut} from 'svelte/easing';
    import {fly} from 'svelte/transition';

    interface Props {
        icon: Component<{class?: string}>;
        text: string;
        dismissLabel: string;
        onDismiss: () => void;
    }

    let {icon: Icon, text, dismissLabel, onDismiss}: Props = $props();
</script>

<div
    transition:fly={{y: 16, duration: respectReducedMotion(200), easing: cubicInOut}}
    class="pointer-events-none absolute inset-x-4 bottom-8 z-2 flex justify-center"
>
    <div
        class="bg-background/95 surface-edge pointer-events-auto flex min-w-0 items-center gap-2 rounded-full py-2 pr-2 pl-4 backdrop-blur-sm"
    >
        <Icon class="text-primary size-4 shrink-0" />
        <span class="text-foreground min-w-0 truncate text-sm">{text}</span>
        <button
            type="button"
            class="hover:bg-muted shrink-0 rounded-full p-1 transition-colors"
            onclick={onDismiss}
            aria-label={dismissLabel}
        >
            <XIcon class="text-muted-foreground size-4" />
        </button>
    </div>
</div>
