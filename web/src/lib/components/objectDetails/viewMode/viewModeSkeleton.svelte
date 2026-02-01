<script lang="ts">
    import {Skeleton} from '$lib/components/ui/skeleton';
</script>

<!-- Actions skeleton -->
<div class="flex items-center justify-between gap-3 border-b bg-gray-50/50 px-4 py-2.5">
    <Skeleton class="h-9 w-24" />
    <Skeleton class="h-8 w-8 rounded" />
    <Skeleton class="h-8 w-8 rounded" />
</div>

<div class="relative h-[calc(100vh-8px*2-57px*2)] space-y-3 overflow-x-hidden overflow-y-auto p-4">
    <!-- Cover image skeleton -->
    <div class="mb-3">
        <Skeleton class="aspect-2/1 w-full rounded-lg" />
    </div>

    <!-- Category and flags row -->
    <div class="flex items-center justify-between">
        <Skeleton class="h-4 w-24" />
        <div class="flex gap-2">
            <Skeleton class="h-4 w-4 rounded-full" />
            <Skeleton class="h-4 w-4 rounded-full" />
        </div>
    </div>

    <!-- Title skeleton -->
    <Skeleton class="h-8 w-3/4" />

    <!-- Tags skeleton -->
    <div class="mb-4 flex flex-wrap gap-2">
        <Skeleton class="h-6 w-16 rounded-full" />
        <Skeleton class="h-6 w-20 rounded-full" />
        <Skeleton class="h-6 w-14 rounded-full" />
    </div>

    <!-- Address skeleton -->
    <div class="flex items-start gap-2">
        <Skeleton class="mt-0.5 h-4 w-4" />
        <div class="flex-1 space-y-1">
            <Skeleton class="h-4 w-full" />
            <Skeleton class="h-4 w-2/3" />
        </div>
    </div>

    <!-- Description skeleton -->
    <div class="space-y-2">
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-5/6" />
        <Skeleton class="h-4 w-4/5" />
    </div>

    <!-- Period skeleton -->
    <div class="space-y-1 pt-2">
        <Skeleton class="h-4 w-32" />
    </div>
</div>
