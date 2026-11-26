<script lang="ts">
    import type {Id} from '$convex/_generated/dataModel';
    import {Button} from '$lib/components/ui/button';
    import {approveObject} from '$lib/services/objectReview';
    import CheckIcon from '@lucide/svelte/icons/check';
    import {useConvexClient} from 'convex-svelte';

    let {id}: {id: Id<'objects'>} = $props();

    const client = useConvexClient();
    let isApproving = $state(false);

    async function handleApproveClick() {
        isApproving = true;
        await approveObject(client, id, 'details');
        isApproving = false;
    }
</script>

<div
    class="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 py-1.5 pr-1.5 pl-3"
>
    <span class="size-2 shrink-0 rounded-full bg-amber-500" aria-hidden="true"></span>
    <p class="text-foreground min-w-0 flex-1 text-sm/snug">Создано по фото — проверьте данные</p>
    <Button size="sm" class="text-sm" loading={isApproving} onclick={handleApproveClick}>
        <CheckIcon />
        Подтвердить
    </Button>
</div>
