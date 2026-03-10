<script lang="ts">
    import {Skeleton} from '$lib/components/ui/skeleton';
    import {Separator} from '$lib/components/ui/separator';
</script>

<!-- Form actions skeleton -->
<div class="flex items-center justify-between gap-3 border-b bg-gray-50/50 px-4 py-2.5">
    <Skeleton class="h-9 w-28" />
    <Skeleton class="h-8 w-8 rounded" />
    <span class="flex-1"></span>
    <Skeleton class="h-8 w-8 rounded" />
</div>

<div class="h-[calc(100vh-8px*2-57px*2)] overflow-x-hidden overflow-y-auto p-4">
    <!-- Cover image skeleton -->
    <div class="mb-6">
        <Skeleton class="aspect-2/1 w-full rounded-lg" />
    </div>

    <div class="grid flex-1 grid-cols-2 content-start gap-x-4 gap-y-3">
        <!-- Name field -->
        <div class="col-span-full space-y-1">
            <Skeleton class="h-4 w-16" />
            <Skeleton class="h-9 w-full rounded-md" />
        </div>

        <Separator class="col-span-full mt-2" />

        <!-- Checkboxes row -->
        <div class="flex items-center space-x-2">
            <Skeleton class="h-4 w-4 rounded" />
            <Skeleton class="h-4 w-20" />
        </div>
        <div class="flex items-center space-x-2">
            <Skeleton class="h-4 w-4 rounded" />
            <Skeleton class="h-4 w-18" />
        </div>
        <div class="flex items-center space-x-2">
            <Skeleton class="h-4 w-4 rounded" />
            <Skeleton class="h-4 w-20" />
        </div>

        <Separator class="col-span-full mt-2" />

        <!-- Category select -->
        <div class="col-span-full space-y-1">
            <Skeleton class="h-4 w-20" />
            <Skeleton class="h-9 w-full rounded-md" />
        </div>

        <!-- Tags select -->
        <div class="col-span-full space-y-1">
            <Skeleton class="h-4 w-12" />
            <Skeleton class="h-9 w-full rounded-md" />
        </div>

        <!-- Private tags select -->
        <div class="col-span-full space-y-1">
            <Skeleton class="h-4 w-28" />
            <Skeleton class="h-9 w-full rounded-md" />
        </div>

        <Separator class="col-span-full mt-2" />

        <!-- Address field -->
        <div class="col-span-full space-y-1">
            <Skeleton class="h-4 w-14" />
            <Skeleton class="h-9 w-full rounded-md" />
        </div>

        <!-- City field -->
        <div class="col-span-1 space-y-1">
            <Skeleton class="h-4 w-14" />
            <Skeleton class="h-9 w-full rounded-md" />
        </div>

        <!-- Country field -->
        <div class="col-span-1 space-y-1">
            <Skeleton class="h-4 w-14" />
            <Skeleton class="h-9 w-full rounded-md" />
        </div>

        <Separator class="col-span-full mt-2" />

        <!-- Installed period -->
        <div class="col-span-1 space-y-1">
            <Skeleton class="h-4 w-28" />
            <Skeleton class="h-9 w-full rounded-md" />
        </div>

        <Separator class="col-span-full mt-2" />

        <!-- Description field -->
        <div class="col-span-full space-y-1">
            <Skeleton class="h-4 w-24" />
            <Skeleton class="h-24 w-full rounded-md" />
        </div>

        <!-- Source field -->
        <div class="col-span-full space-y-1">
            <Skeleton class="h-4 w-32" />
            <Skeleton class="h-9 w-full rounded-md" />
        </div>
    </div>
</div>
