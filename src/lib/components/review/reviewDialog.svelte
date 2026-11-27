<script lang="ts">
    import {api} from '$convex/_generated/api';
    import DialogHeading from '$lib/components/dialogHeading.svelte';
    import LoadingDots from '$lib/components/loadingDots.svelte';
    import RoutedDialog from '$lib/components/routedDialog.svelte';
    import {buttonVariants} from '$lib/components/ui/button';
    import {Content, Footer} from '$lib/components/ui/dialog';
    import {DialogClose} from '$lib/components/ui/dialog/index.js';
    import {photoCaptureState} from '$lib/state/photoCapture.svelte';
    import ListChecksIcon from '@lucide/svelte/icons/list-checks';
    import {useQuery} from 'convex-svelte';
    import type {Snippet} from 'svelte';
    import CaptureRow from './captureRow.svelte';
    import OpenRouterKeySection from './openRouterKeySection.svelte';
    import PendingObjectRow from './pendingObjectRow.svelte';
    import UnsentCaptureRow from './unsentCaptureRow.svelte';

    let {isOpen = $bindable()}: {isOpen: boolean} = $props();

    const captures = useQuery(api.photoCaptures.list, {});
    const pending = useQuery(api.pendingReview.list, {});

    const inProgressCount = $derived(
        photoCaptureState.unsent.length + (captures.data?.length ?? 0),
    );
    const isLoading = $derived(!captures.data || !pending.data);
</script>

{#snippet section(title: string, count: number | null, rows: Snippet)}
    <section class="pb-2">
        <h3 class="text-muted-foreground flex justify-between px-3 pt-2 pb-1 text-xs font-medium">
            <span>{title}</span>
            {#if count !== null}
                <span class="tabular-nums">{count}</span>
            {/if}
        </h3>
        {@render rows()}
    </section>
{/snippet}

<RoutedDialog bind:isOpen>
    <Content
        class="flex max-h-[85vh] flex-col overflow-hidden border-t-0 p-0 max-sm:gap-0 sm:max-w-lg"
    >
        <DialogHeading
            icon={ListChecksIcon}
            title="На проверке"
            hint="Объекты, созданные по фото"
        />

        <div class="min-h-0 space-y-2 overflow-y-auto px-3 pb-4">
            {#if isLoading}
                <div class="text-muted-foreground px-3 py-8 text-center text-sm">
                    <LoadingDots />
                </div>
            {:else if inProgressCount === 0 && pending.data?.length === 0}
                <p class="text-muted-foreground px-3 py-8 text-center text-sm">Всё проверено</p>
            {/if}
            {#if inProgressCount > 0}
                {#snippet inProgressRows()}
                    {#each photoCaptureState.unsent as capture (capture.id)}
                        <UnsentCaptureRow {capture} />
                    {/each}
                    {#each captures.data ?? [] as capture (capture.id)}
                        <CaptureRow {capture} />
                    {/each}
                {/snippet}
                {@render section('В обработке', null, inProgressRows)}
            {/if}
            {#if pending.data?.length}
                {#snippet pendingRows()}
                    {#each pending.data ?? [] as object (object.id)}
                        <PendingObjectRow {object} />
                    {/each}
                {/snippet}
                {@render section('Ждут проверки', pending.data.length, pendingRows)}
            {/if}
            <OpenRouterKeySection />
        </div>

        <Footer
            class="border-border/50 bg-muted/20 shrink-0 gap-3 border-t px-6 py-3 max-sm:grid max-sm:auto-cols-fr max-sm:grid-flow-col max-sm:*:h-11 sm:py-4"
        >
            <DialogClose class={buttonVariants({variant: 'outline'})}>Закрыть</DialogClose>
        </Footer>
    </Content>
</RoutedDialog>
