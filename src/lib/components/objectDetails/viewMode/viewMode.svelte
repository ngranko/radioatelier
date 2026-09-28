<script lang="ts">
    import CategoryBadge from '$lib/components/categoryBadge.svelte';
    import ImageUpload from '$lib/components/input/imageUpload/index.svelte';
    import Flags, {hasAnyFlag} from '$lib/components/objectDetails/viewMode/flags.svelte';
    import type {LooseObject} from '$lib/interfaces/object.ts';
    import type {Permissions} from '$lib/interfaces/permissions';
    import {extractHostname} from '$lib/utils/url';
    import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
    import Actions from './actions.svelte';
    import AddCoverButton from './addCoverButton.svelte';
    import Address from './address.svelte';
    import Tags from './tags.svelte';

    interface Props {
        initialValues: Partial<LooseObject>;
        permissions?: Permissions;
    }

    let {initialValues, permissions = {canEditAll: true, canEditPersonal: true}}: Props = $props();

    const flags = $derived({
        isPublic: initialValues.isPublic ?? false,
        isVisited: initialValues.isVisited ?? false,
        isRemoved: initialValues.isRemoved ?? false,
    });
    const hasChips = $derived(
        hasAnyFlag(flags) ||
            Boolean(initialValues.tags?.length || initialValues.privateTags?.length),
    );
    const description = $derived(initialValues.description?.replace(/\\r\\n|\\n|\\r/g, '\n'));
    // unticking "утрачена" hides the field in the form but keeps its value
    const removalPeriod = $derived(initialValues.isRemoved ? initialValues.removalPeriod : null);
    const sourceHost = $derived(
        initialValues.source ? extractHostname(initialValues.source) : null,
    );
</script>

<Actions
    id={initialValues.id ?? undefined}
    name={initialValues.name}
    lat={initialValues.latitude != null ? String(initialValues.latitude) : ''}
    lng={initialValues.longitude != null ? String(initialValues.longitude) : ''}
    {permissions}
/>
<div class="relative min-h-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto p-4">
    <div class="mb-3">
        {#if !initialValues.cover && permissions.canEditAll}
            <AddCoverButton categoryId={initialValues.category?.id} />
        {:else}
            <ImageUpload
                value={initialValues.cover?.id}
                onChange={() => {
                    /* do nothing */
                }}
                url={initialValues.cover?.url}
                previewUrl={initialValues.cover?.previewUrl}
                categoryId={initialValues.category?.id}
                disabled
            />
        {/if}
    </div>
    <div class={hasChips ? '' : 'mb-4'}>
        {#if initialValues.category}
            <div class="flex">
                <CategoryBadge
                    name={initialValues.category.name}
                    categoryId={initialValues.category.id}
                />
            </div>
        {/if}
        <h1 class="text-foreground text-2xl leading-tight font-semibold">
            {initialValues.name}
        </h1>
    </div>
    {#if hasChips}
        <div class="mb-4 flex flex-wrap gap-2">
            <Flags {...flags} />
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
    {#if description}
        <p class="text-foreground text-base leading-relaxed whitespace-pre-line">
            {description}
        </p>
    {/if}
    {#if initialValues.installedPeriod || removalPeriod}
        <dl class="flex gap-4 text-sm">
            {#if initialValues.installedPeriod}
                <div class="flex-1">
                    <dt class="text-muted-foreground">Появилась</dt>
                    <dd>{initialValues.installedPeriod}</dd>
                </div>
            {/if}
            {#if removalPeriod}
                <div class="flex-1">
                    <dt class="text-muted-foreground">Пропала</dt>
                    <dd>{removalPeriod}</dd>
                </div>
            {/if}
        </dl>
    {/if}
    {#if initialValues.source}
        <div class="pt-2">
            <a
                href={initialValues.source}
                target="_blank"
                rel="noopener noreferrer nofollow"
                class="text-primary hover:text-primary/90 inline-flex items-center gap-1 text-sm hover:underline"
            >
                {sourceHost ? `Источник · ${sourceHost}` : 'Источник'}
                <ExternalLinkIcon class="ml-1 size-3.5" />
            </a>
        </div>
    {/if}
</div>
