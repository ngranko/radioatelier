<script lang="ts">
    import CategorySelect from '$lib/components/objectDetails/categorySelect.svelte';
    import TagsSelect from '$lib/components/objectDetails/tagsSelect.svelte';
    import type {LooseObject} from '$lib/interfaces/object';
    import Input from '$lib/components/input/input.svelte';
    import Textarea from '$lib/components/input/textarea.svelte';
    import Checkbox from '$lib/components/input/checkbox.svelte';

    export let initialValues: Partial<LooseObject>;
    export let tags: string[] = [];
</script>

<input type="hidden" name="id" value={initialValues.id} />
<input type="hidden" name="lat" value={initialValues.lat} />
<input type="hidden" name="lng" value={initialValues.lng} />

<div class="field">
    <label for="name" class="label">Название</label>
    <Input id="name" name="name" value={initialValues.name ?? ''} />
</div>
<div class="field">
    <label for="categoryId" class="label">Категория</label>
    <CategorySelect id="categoryId" name="categoryId" value={initialValues.categoryId} />
</div>
<div class="field">
    <label for="tags" class="label">Теги</label>
    <TagsSelect
        id="tags"
        name="tags"
        bind:initialValue={initialValues.tags}
        bind:selection={tags}
    />
</div>
<div class="field">
    <label for="description" class="label">Информация</label>
    <Textarea id="description" name="description" value={initialValues.description ?? ''} />
</div>
<div class="field">
    <label for="address" class="label">Адрес</label>
    <Input id="address" name="address" value={initialValues.address ?? ''} />
</div>
<div class="field">
    <label for="installedPeriod" class="label">Период создания</label>
    <Input
        id="installedPeriod"
        name="installedPeriod"
        value={initialValues.installedPeriod ?? ''}
    />
</div>
<Checkbox
    id="isRemoved"
    name="isRemoved"
    bind:checked={initialValues.isRemoved}
    label="Уничтожена"
/>
{#if initialValues.isRemoved}
    <div class="field">
        <label for="removalPeriod" class="label">Период пропажи</label>
        <Input id="removalPeriod" name="removalPeriod" value={initialValues.removalPeriod ?? ''} />
    </div>
{/if}
<div class="field">
    <label for="source" class="label">Источник</label>
    <Input id="source" name="source" value={initialValues.source ?? ''} />
</div>

<style lang="scss">
    @use '../../../styles/colors';
    @use '../../../styles/typography';

    .field {
        display: flex;
        flex-direction: column;
        align-items: stretch;
    }

    .label {
        @include typography.size-14;
        margin-bottom: 4px;
    }
</style>
