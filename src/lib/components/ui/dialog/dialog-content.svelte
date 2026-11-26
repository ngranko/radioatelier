<script lang="ts">
    import {cn, type WithoutChildrenOrChild} from '$lib/utils.js';
    import XIcon from '@lucide/svelte/icons/x';
    import {Dialog as DialogPrimitive} from 'bits-ui';
    import type {Snippet} from 'svelte';
    import * as Dialog from './index.js';

    let {
        ref = $bindable(null),
        class: className,
        portalProps,
        children,
        showCloseButton = true,
        ...restProps
    }: WithoutChildrenOrChild<DialogPrimitive.ContentProps> & {
        portalProps?: DialogPrimitive.PortalProps;
        children: Snippet;
        showCloseButton?: boolean;
    } = $props();
</script>

<Dialog.Portal {...portalProps}>
    <Dialog.Overlay />
    <DialogPrimitive.Content
        bind:ref
        data-slot="dialog-content"
        class={cn(
            'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-[-50%] gap-4 rounded-2xl border p-6 shadow-lg duration-200 sm:max-w-lg',
            className,
        )}
        {...restProps}
    >
        {@render children?.()}
        {#if showCloseButton}
            <DialogPrimitive.Close
                class="ring-offset-background focus:ring-ring absolute inset-e-4 top-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none pointer-coarse:after:absolute pointer-coarse:after:-inset-3.5 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            >
                <XIcon />
                <span class="sr-only">Закрыть</span>
            </DialogPrimitive.Close>
        {/if}
    </DialogPrimitive.Content>
</Dialog.Portal>
