<script lang="ts">
    import FormSelect from '$lib/components/form/formSelect.svelte';

    export let preview: string[][] = [];
</script>

<form>
    <FormSelect
        id="coordinates"
        name="coordinates"
        label="Координаты (широта, долгота)*"
        required
        placeholder="Выберите колонку"
        options={preview[0].map((item, index) => ({value: index, text: item}))}
    />
    <FormSelect
        id="name"
        name="name"
        label="Название*"
        required
        placeholder="Выберите колонку"
        options={preview[0].map((item, index) => ({value: index, text: item}))}
    />
    <FormSelect
        id="category"
        name="category"
        label="Категория*"
        required
        placeholder="Выберите колонку"
        options={preview[0].map((item, index) => ({value: index, text: item}))}
    />
    <FormSelect
        id="image"
        name="image"
        label="Фотография"
        placeholder="Не заполнять"
        options={preview[0].map((item, index) => ({value: index, text: item}))}
    />
    <FormSelect
        id="tags"
        name="tags"
        label="Теги"
        placeholder="Не заполнять"
        options={preview[0].map((item, index) => ({value: index, text: item}))}
    />
    <FormSelect
        id="privateTags"
        name="privateTags"
        label="Приватные теги"
        placeholder="Не заполнять"
        options={preview[0].map((item, index) => ({value: index, text: item}))}
    />
    <FormSelect
        id="description"
        name="description"
        label="Информация"
        placeholder="Не заполнять"
        options={preview[0].map((item, index) => ({value: index, text: item}))}
    />
    <FormSelect
        id="description"
        name="description"
        label="Информация"
        placeholder="Не заполнять"
        options={preview[0].map((item, index) => ({value: index, text: item}))}
    />
    <FormSelect
        id="address"
        name="address"
        label="Адрес"
        placeholder="Не заполнять"
        options={preview[0].map((item, index) => ({value: index, text: item}))}
    />
    <FormSelect
        id="city"
        name="city"
        label="Город"
        placeholder="Не заполнять"
        options={preview[0].map((item, index) => ({value: index, text: item}))}
    />
    <FormSelect
        id="country"
        name="country"
        label="Страна"
        placeholder="Не заполнять"
        options={preview[0].map((item, index) => ({value: index, text: item}))}
    />
</form>
