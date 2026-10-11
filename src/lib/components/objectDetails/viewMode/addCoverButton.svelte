<script lang="ts">
    import type {Id} from '$convex/_generated/dataModel';
    import EmptyPlaceholder from '$lib/components/input/imageUpload/emptyPlaceholder.svelte';
    import {IMAGE_INPUT_ACCEPT} from '$lib/components/input/imageUpload/imageTypes';
    import {buttonVariants} from '$lib/components/ui/button';
    import {enterEditMode} from '$lib/state/objectDetailsOverlay.svelte';
    import {cn} from '$lib/utils.ts';
    import UploadIcon from '@lucide/svelte/icons/upload';

    interface Props {
        categoryId?: Id<'categories'> | null;
    }

    let {categoryId = null}: Props = $props();

    let fileInput: HTMLInputElement | undefined = $state();

    // the picker opens here, inside the tap, because browsers only allow it during
    // a user gesture; the form it hands the file to is mounted only afterwards
    function handleFileChange() {
        const file = fileInput?.files?.[0];
        if (file) {
            enterEditMode(file);
        }
    }
</script>

<div class="bg-muted/30 border-border relative w-full overflow-hidden rounded-lg border">
    <button
        type="button"
        class="block w-full cursor-pointer"
        onclick={() => fileInput?.click()}
        aria-label="Добавить фото"
        title="Добавить фото"
    >
        <EmptyPlaceholder {categoryId} />
        <span
            class={cn(
                buttonVariants({variant: 'secondary', size: 'icon'}),
                'text-foreground/80 absolute right-3 bottom-3 shadow-sm',
            )}
        >
            <UploadIcon />
        </span>
    </button>
    <input
        bind:this={fileInput}
        class="hidden"
        type="file"
        accept={IMAGE_INPUT_ACCEPT}
        onchange={handleFileChange}
    />
</div>
