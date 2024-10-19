<script lang="ts">
    import FormSelect from '$lib/components/form/formSelect.svelte';
    import TextButton from '$lib/components/button/textButton.svelte';
    import PrimaryButton from '$lib/components/button/primaryButton.svelte';
    import {createEventDispatcher} from 'svelte';
    import {createForm} from 'felte';
    import * as yup from 'yup';
    import {validator} from '@felte/validator-yup';
    import Tooltip from '$lib/components/tooltip.svelte';
    import {importInfo} from '$lib/stores/import';

    const dispatch = createEventDispatcher();

    const schema = yup.object({
        coordinates: yup
            .number()
            .required('Пожалуйста, выберите колонку')
            .test('validFormat', 'Допустимый формат: 0.000000,0.000000', (value: number) => {
                const regex = /^-?\d{1,3}\.\d+,\s?-?\d{1,3}\.\d+$/;
                return regex.test($importInfo.preview[1][value]);
            }),
        name: yup.number().required('Пожалуйста, выберите колонку'),
        isVisited: yup.number().nullable(),
        rating: yup
            .number()
            .nullable()
            .test('validRating', 'Рейтинг может быть от 1 до 3', value => {
                if (!value) {
                    return true;
                }
                return (
                    ['1', '2', '3'].includes($importInfo.preview[1][value]) ||
                    $importInfo.preview[1][value] === ''
                );
            }),
        isPublic: yup.number().nullable(),
        category: yup.number().required('Пожалуйста, выберите колонку'),
        image: yup.number().nullable(),
        tags: yup
            .number()
            .nullable()
            .test(
                'validFormat',
                'Допустимый формат: tag1; tag2; tag3',
                (value: number | null | undefined) => {
                    if (!value) {
                        return true;
                    }
                    const regex = /^([а-яА-Я\w\s!,.\-–—()]+;\s?)*[а-яА-Я\w\s!,.\-–—()]+$/;
                    return (
                        regex.test($importInfo.preview[1][value]) ||
                        $importInfo.preview[1][value] === ''
                    );
                },
            ),
        privateTags: yup
            .number()
            .nullable()
            .test(
                'validFormat',
                'Допустимый формат: tag1; tag2; tag3',
                (value: number | null | undefined) => {
                    if (!value) {
                        return true;
                    }
                    const regex = /^([а-яА-Я\w\s!,.\-–—()]+;\s?)*[а-яА-Я\w\s!,.\-–—()]+$/;
                    return (
                        regex.test($importInfo.preview[1][value]) ||
                        $importInfo.preview[1][value] === ''
                    );
                },
            ),
        description: yup.number().nullable(),
        address: yup.number().nullable(),
        city: yup.number().nullable(),
        country: yup.number().nullable(),
        installedPeriod: yup.number().nullable(),
        isRemoved: yup.number().nullable(),
        removalPeriod: yup.number().nullable(),
        source: yup
            .number()
            .nullable()
            .test('isUrl', 'Должно быть ссылкой', (value: number | null | undefined) => {
                if (!value) {
                    return true;
                }
                try {
                    new URL($importInfo.preview[1][value]);
                    return true;
                } catch (e) {
                    return $importInfo.preview[1][value] === '';
                }
            }),
    });

    const {form, data, errors, isSubmitting, reset} = createForm<yup.InferType<typeof schema>>({
        onSubmit: async (values: unknown) => {
            dispatch('submit', values);
        },
        extend: validator({schema}),
    });

    function handleClose() {
        reset();
        dispatch('close');
    }
</script>

<form use:form>
    <div class="fieldWrapper">
        <FormSelect
            id="coordinates"
            name="coordinates"
            label="Координаты (широта, долгота)*"
            required
            placeholder="Выберите колонку"
            bind:value={$data.coordinates}
            options={$importInfo.preview[0]?.map((item, index) => ({value: index, text: item}))}
            error={$errors.coordinates}
        />
        <Tooltip class="fieldTooltip">
            Импорт понимает координаты в формате [широта,долгота]. Например: 41.8420113,-89.4859696.
            Пробел после запятой опционален.
        </Tooltip>
    </div>
    <div class="fieldWrapper">
        <FormSelect
            id="name"
            name="name"
            label="Название*"
            required
            placeholder="Выберите колонку"
            bind:value={$data.name}
            options={$importInfo.preview[0]?.map((item, index) => ({value: index, text: item}))}
            error={$errors.name}
        />
        <Tooltip class="fieldTooltip">
            Максимальная длина – 255 символов. Слишком длинные названия будут обрезаны.
        </Tooltip>
    </div>
    <div class="fieldWrapper">
        <FormSelect
            id="isVisited"
            name="isVisited"
            label="Посещена"
            placeholder="Выберите колонку"
            bind:value={$data.isVisited}
            options={$importInfo.preview[0]?.map((item, index) => ({value: index, text: item}))}
            error={$errors.isVisited}
        />
        <Tooltip class="fieldTooltip">
            Понимает значения 0 и 1. Остальные значения будут приведены к этим двум.
        </Tooltip>
    </div>
    <div class="fieldWrapper">
        <FormSelect
            id="rating"
            name="rating"
            label="Рейтинг"
            placeholder="Выберите колонку"
            bind:value={$data.rating}
            options={$importInfo.preview[0]?.map((item, index) => ({value: index, text: item}))}
            error={$errors.rating}
        />
        <Tooltip class="fieldTooltip">
            Может быть от 1 до 3. Любые другие значения будут проигнорированы.
        </Tooltip>
    </div>
    <div class="fieldWrapper">
        <FormSelect
            id="isPublic"
            name="isPublic"
            label="Публичная"
            placeholder="Выберите колонку"
            bind:value={$data.isPublic}
            options={$importInfo.preview[0]?.map((item, index) => ({value: index, text: item}))}
            error={$errors.isPublic}
        />
        <Tooltip class="fieldTooltip">
            Понимает значения 0 и 1. Остальные значения будут приведены к этим двум.
        </Tooltip>
    </div>
    <div class="fieldWrapper">
        <FormSelect
            id="category"
            name="category"
            label="Категория*"
            required
            placeholder="Выберите колонку"
            bind:value={$data.category}
            options={$importInfo.preview[0]?.map((item, index) => ({value: index, text: item}))}
            error={$errors.category}
        />
        <Tooltip class="fieldTooltip">
            Максимальная длина – 100 символов. Слишком длинные названия будут обрезаны.
        </Tooltip>
    </div>
    <div class="fieldWrapper">
        <FormSelect
            id="image"
            name="image"
            label="Фотография"
            placeholder="Не заполнять"
            bind:value={$data.image}
            options={$importInfo.preview[0]?.map((item, index) => ({value: index, text: item}))}
            error={$errors.image}
        />
        <Tooltip class="fieldTooltip">
            Может быть ссылкой на фотографию или base64-кодированным содержанием.
        </Tooltip>
    </div>
    <div class="fieldWrapper">
        <FormSelect
            id="tags"
            name="tags"
            label="Теги"
            placeholder="Не заполнять"
            bind:value={$data.tags}
            options={$importInfo.preview[0]?.map((item, index) => ({value: index, text: item}))}
            error={$errors.tags}
        />
        <Tooltip class="fieldTooltip">
            Список тегов, разделенных точкой с запятой. Например: tag1; tag2; tag3. Можно
            использовать пробелы и символы <code>!,.-()</code>
            . Максимальная длина каждого тега – 100 символов. Слишком длинные теги будут обрезаны
        </Tooltip>
    </div>
    <div class="fieldWrapper">
        <FormSelect
            id="privateTags"
            name="privateTags"
            label="Приватные теги"
            placeholder="Не заполнять"
            bind:value={$data.privateTags}
            options={$importInfo.preview[0]?.map((item, index) => ({value: index, text: item}))}
            error={$errors.privateTags}
        />
        <Tooltip class="fieldTooltip">
            Список тегов, разделенных точкой с запятой. Например: tag1; tag2; tag3. Можно
            использовать пробелы и символы <code>!,.-()</code>
            . Максимальная длина каждого тега – 100 символов. Слишком длинные теги будут обрезаны
        </Tooltip>
    </div>
    <div class="fieldWrapper">
        <FormSelect
            id="description"
            name="description"
            label="Информация"
            placeholder="Не заполнять"
            bind:value={$data.description}
            options={$importInfo.preview[0]?.map((item, index) => ({value: index, text: item}))}
            error={$errors.description}
        />
        <Tooltip class="fieldTooltip">Любая информация о точке.</Tooltip>
    </div>
    <div class="fieldWrapper">
        <FormSelect
            id="address"
            name="address"
            label="Адрес"
            placeholder="Не заполнять"
            bind:value={$data.address}
            options={$importInfo.preview[0]?.map((item, index) => ({value: index, text: item}))}
            error={$errors.address}
        />
        <Tooltip class="fieldTooltip">
            Максимальная длина – 128 символов. Слишком длинные адреса будут обрезаны.
        </Tooltip>
    </div>
    <div class="fieldWrapper">
        <FormSelect
            id="city"
            name="city"
            label="Город"
            placeholder="Не заполнять"
            bind:value={$data.city}
            options={$importInfo.preview[0]?.map((item, index) => ({value: index, text: item}))}
            error={$errors.city}
        />
        <Tooltip class="fieldTooltip">
            Максимальная длина – 64 символа. Слишком длинные названия будут обрезаны.
        </Tooltip>
    </div>
    <div class="fieldWrapper">
        <FormSelect
            id="country"
            name="country"
            label="Страна"
            placeholder="Не заполнять"
            bind:value={$data.country}
            options={$importInfo.preview[0]?.map((item, index) => ({value: index, text: item}))}
            error={$errors.country}
        />
        <Tooltip class="fieldTooltip">
            Максимальная длина – 64 символа. Слишком длинные названия будут обрезаны.
        </Tooltip>
    </div>
    <div class="fieldWrapper">
        <FormSelect
            id="installedPeriod"
            name="installedPeriod"
            label="Период создания"
            placeholder="Не заполнять"
            bind:value={$data.installedPeriod}
            options={$importInfo.preview[0]?.map((item, index) => ({value: index, text: item}))}
            error={$errors.installedPeriod}
        />
        <Tooltip class="fieldTooltip">
            Максимальная длина – 20 символов. Слишком длинные строки будут обрезаны.
        </Tooltip>
    </div>
    <div class="fieldWrapper">
        <FormSelect
            id="isRemoved"
            name="isRemoved"
            label="Утрачена"
            placeholder="Не заполнять"
            bind:value={$data.isRemoved}
            options={$importInfo.preview[0]?.map((item, index) => ({value: index, text: item}))}
            error={$errors.isRemoved}
        />
        <Tooltip class="fieldTooltip">
            Понимает значения 0 и 1. Остальные значения будут приведены к этим двум.
        </Tooltip>
    </div>
    <div class="fieldWrapper">
        <FormSelect
            id="removalPeriod"
            name="removalPeriod"
            label="Период пропажи"
            placeholder="Не заполнять"
            bind:value={$data.removalPeriod}
            options={$importInfo.preview[0]?.map((item, index) => ({value: index, text: item}))}
            error={$errors.removalPeriod}
        />
        <Tooltip class="fieldTooltip">
            Максимальная длина – 20 символов. Слишком длинные строки будут обрезаны.
        </Tooltip>
    </div>
    <div class="fieldWrapper">
        <FormSelect
            id="source"
            name="source"
            label="Ссылка на источник"
            placeholder="Не заполнять"
            bind:value={$data.source}
            options={$importInfo.preview[0]?.map((item, index) => ({value: index, text: item}))}
            error={$errors.source}
        />
        <Tooltip class="fieldTooltip">
            Должна быть валидной ссылкой, другие значения будут проигнорированы.
        </Tooltip>
    </div>
    <div class="actions">
        <TextButton type="button" on:click={handleClose}>Отменить</TextButton>
        <span class="import">
            <PrimaryButton disabled={$isSubmitting.valueOf()}>Импортировать</PrimaryButton>
        </span>
    </div>
</form>

<style lang="scss">
    @use '../../../../styles/colors';

    .fieldWrapper {
        margin-bottom: 16px;
        display: flex;
        align-items: center;

        & :global(.fieldTooltip) {
            margin-top: 24px;
        }

        & > :global(:first-child) {
            flex: 1;
        }

        & > :global(:last-child) {
            z-index: 1;
        }
    }

    .actions {
        position: sticky;
        bottom: -24px;
        right: 24px;
        left: 24px;
        padding: 24px 0;
        border-top: 1px solid colors.$gray;
        display: flex;
        justify-content: flex-end;
        background-color: colors.$white;
        z-index: 1;
    }

    .import {
        margin-left: 8px;
    }
</style>
