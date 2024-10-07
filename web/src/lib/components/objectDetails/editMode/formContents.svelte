<script lang="ts">
    import CategorySelect from '$lib/components/objectDetails/editMode/categorySelect.svelte';
    import TagsSelect from '$lib/components/objectDetails/editMode/tagsSelect.svelte';
    import PrivateTagsSelect from '$lib/components/objectDetails/editMode/privateTagsSelect.svelte';
    import type {LooseObject} from '$lib/interfaces/object';
    import Input from '$lib/components/input/input.svelte';
    import Textarea from '$lib/components/input/textarea.svelte';
    import Checkbox from '$lib/components/input/checkbox.svelte';
    import Switch from '$lib/components/input/switch.svelte';
    import FormSelect from '$lib/components/form/formSelect.svelte';

    export let initialValues: Partial<LooseObject>;
</script>

<input type="hidden" name="id" value={initialValues.id} />
<input type="hidden" name="lat" value={initialValues.lat} />
<input type="hidden" name="lng" value={initialValues.lng} />
<input type="hidden" name="image" value={initialValues.image ?? ''} />

<div class="fieldLong">
    <label for="name" class="label">Название</label>
    <Input id="name" name="name" value={initialValues.name ?? ''} />
</div>
<Checkbox id="isVisited" name="isVisited" bind:checked={initialValues.isVisited} label="Посещена" />
<FormSelect
    id="rating"
    name="rating"
    label="Рейтинг"
    placeholder="Выберите"
    bind:value={initialValues.rating}
    options={[
        {value: '1', text: '⭐️'},
        {value: '2', text: '⭐⭐'},
        {value: '3', text: '🌟🌟🌟'},
    ]}
/>
<div class="fieldLong">
    <Switch id="isPublic" name="isPublic" bind:checked={initialValues.isPublic} label="Публичная" />
</div>
<div class="fieldLong">
    <label for="categoryId" class="label">Категория</label>
    <CategorySelect id="categoryId" name="categoryId" bind:value={initialValues.category} />
</div>
<div class="fieldLong">
    <label for="tags" class="label">Теги</label>
    <TagsSelect id="tags" name="tags" bind:initialValue={initialValues.tags} />
</div>
<div class="fieldLong">
    <label for="privateTags" class="label">Приватные теги</label>
    <PrivateTagsSelect
        id="privateTags"
        name="privateTags"
        bind:initialValue={initialValues.privateTags}
    />
</div>
<div class="fieldLong">
    <label for="description" class="label">Информация</label>
    <Textarea id="description" name="description" value={initialValues.description ?? ''} />
</div>
<div class="fieldLong">
    <label for="address" class="label">Адрес</label>
    <Input id="address" name="address" value={initialValues.address ?? ''} />
</div>
<div class="fieldLong">
    <label for="city" class="label">Город</label>
    <Input id="city" name="city" value={initialValues.city ?? ''} />
</div>
<div class="fieldLong">
    <label for="country" class="label">Страна</label>
    <Input id="country" name="country" value={initialValues.country ?? ''} />
</div>
<div class="fieldLong">
    <label for="installedPeriod" class="label">Период создания</label>
    <Input
        id="installedPeriod"
        name="installedPeriod"
        value={initialValues.installedPeriod ?? ''}
    />
</div>
<div class="removedCheckbox">
    <Checkbox
        id="isRemoved"
        name="isRemoved"
        bind:checked={initialValues.isRemoved}
        label="Утрачена"
    />
</div>
{#if initialValues.isRemoved}
    <div class="field">
        <label for="removalPeriod" class="label">Период пропажи</label>
        <Input id="removalPeriod" name="removalPeriod" value={initialValues.removalPeriod ?? ''} />
    </div>
{/if}
<div class="fieldLong">
    <label for="source" class="label">Ссылка на источник</label>
    <Input id="source" name="source" value={initialValues.source ?? ''} />
</div>

<style lang="scss">
    @use '../../../../styles/colors';
    @use '../../../../styles/typography';

    .field {
        display: flex;
        flex-direction: column;
        align-items: stretch;
    }

    .fieldLong {
        @extend .field;
        grid-column: 1 / -1;
    }

    .label {
        @include typography.size-14;
        margin-bottom: 4px;
    }

    .removedCheckbox {
        height: 62.1px;
        display: flex;
    }
</style>
