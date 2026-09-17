<script lang="ts">
    import {Skeleton} from '$lib/components/ui/skeleton';
    import type {Permissions} from '$lib/interfaces/permissions';

    interface Props {
        permissions: Permissions;
    }

    let {permissions}: Props = $props();

    const buttonCount = $derived(permissions.canEditAll || permissions.canEditPersonal ? 4 : 3);
</script>

<div class="bg-muted/40 flex items-center justify-end gap-2 border-b px-4 py-2.5">
    {#each {length: buttonCount}}
        <Skeleton class="size-9 rounded-xl" />
    {/each}
</div>

<div class="relative min-h-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto p-4">
    <div class="mb-3">
        <Skeleton class="aspect-2/1 w-full rounded-lg" />
    </div>

    <div>
        <div class="flex h-6 items-center justify-between">
            <div class="flex items-center gap-1.5">
                <Skeleton class="size-5 rounded-full" />
                <Skeleton class="h-4 w-24" />
            </div>
            <div class="flex gap-3 px-1">
                <Skeleton class="size-4 rounded-full" />
                <Skeleton class="size-4 rounded-full" />
            </div>
        </div>
        <Skeleton class="h-7.5 w-3/4" />
    </div>

    <div class="mb-4 flex flex-wrap gap-2">
        <Skeleton class="h-5.5 w-16" />
        <Skeleton class="h-5.5 w-20" />
        <Skeleton class="h-5.5 w-14" />
    </div>

    <Skeleton class="my-1 h-4 w-2/3" />

    <div class="space-y-1.5">
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-5/6" />
        <Skeleton class="h-4 w-4/5" />
    </div>

    <Skeleton class="my-0.5 h-4 w-32" />
</div>
