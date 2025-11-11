<script lang="ts">
    import type {LooseObject} from '$lib/interfaces/object.ts';
    import Flags from '$lib/components/objectDetails/viewMode/flags.svelte';
    import Tags from './tags.svelte';
    import Address from './address.svelte';
    import Actions from './actions.svelte';
    import ImageUpload from '$lib/components/input/imageUpload.svelte';
    import type {Permissions} from '$lib/interfaces/permissions';

    interface Props {
        initialValues: Partial<LooseObject>;
        permissions?: Permissions;
    }

    let {initialValues, permissions = {canEditAll: true, canEditPersonal: true}}: Props = $props();

    function startsWithNumber(str: string): boolean {
        const char = str.charAt(0);
        return char >= '0' && char <= '9';
    }
</script>

<Actions lat={initialValues.lat ?? ''} lng={initialValues.lng ?? ''} {permissions} />
<div class="relative h-[calc(100vh-8px*2-57px*2)] space-y-3 overflow-x-hidden overflow-y-auto p-4">
    <div class="mb-3">
        <ImageUpload
            value={initialValues.cover?.id}
            onChange={() => {
                /* do nothing */
            }}
            url={initialValues.cover?.url}
            previewUrl={initialValues.cover?.previewUrl}
            disabled
        />
    </div>
    <div class={!initialValues.tags?.length && !initialValues.privateTags?.length ? 'mb-4' : ''}>
        <div class="flex items-center justify-between">
            <div class="text-sm text-gray-500">{initialValues.category?.name ?? ''}</div>
            <Flags
                isPublic={initialValues.isPublic ?? false}
                isVisited={initialValues.isVisited ?? false}
                isRemoved={initialValues.isRemoved ?? false}
            />
        </div>
        <h1 class="text-2xl leading-tight font-semibold text-gray-900">{initialValues.name}</h1>
    </div>
    {#if initialValues.tags?.length || initialValues.privateTags?.length}
        <div class="mb-4">
            <Tags tags={initialValues.tags ?? []} privateTags={initialValues.privateTags ?? []} />
        </div>
    {/if}
    {#if initialValues.address || initialValues.city || initialValues.country}
        <Address
            address={initialValues.address}
            city={initialValues.city}
            country={initialValues.country}
        />
    {/if}
    {#if initialValues.description}
        <p class="text-sm leading-relaxed whitespace-pre-line text-gray-700">
            {initialValues.description}
        </p>
    {/if}
    {#if initialValues.installedPeriod || initialValues.removalPeriod}
        <div class="space-y-1">
            {#if initialValues.installedPeriod}
                <div class="text-sm text-gray-500">
                    Появилась <span class="lowercase">
                        {startsWithNumber(initialValues.installedPeriod)
                            ? 'в ' + initialValues.installedPeriod
                            : initialValues.installedPeriod}
                    </span>
                </div>
            {/if}
            {#if initialValues.removalPeriod}
                <div class="text-sm text-gray-500">
                    Пропала <span class="lowercase">
                        {startsWithNumber(initialValues.removalPeriod)
                            ? 'в ' + initialValues.removalPeriod
                            : initialValues.removalPeriod}
                    </span>
                </div>
            {/if}
        </div>
    {/if}
    {#if initialValues.source}
        <div class="pt-2">
            <a
                href={initialValues.source}
                target="_blank"
                rel="noopener noreferrer nofollow"
                class="inline-flex items-center gap-1 text-sm text-sky-600 hover:text-sky-700 hover:underline"
            >
                Источник
                <i class="fa-solid fa-arrow-up-right-from-square ml-1 text-xs"></i>
            </a>
        </div>
    {/if}
</div>
