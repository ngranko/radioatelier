<script lang="ts">
    interface Props {
        id?: string | undefined;
        name?: string | undefined;
        value: string;
        placeholder?: string | undefined;
        required?: boolean;
    }

    let {
        id = undefined,
        name = undefined,
        value,
        placeholder = undefined,
        required = false,
    }: Props = $props();
</script>

<textarea {id} {name} {value} {placeholder} {required} class="element"></textarea>

<style lang="scss">
    @use '../../../styles/colors';
    @use '../../../styles/typography';

    .element {
        @include typography.brand-face;
        @include typography.size-16;
        resize: vertical;
        min-height: 120px;
        padding: 7px 10px;
        border-radius: 6px;
        border: 1px solid colors.$gray;
        transition: box-shadow 0.1s;

        &:focus {
            box-shadow: inset 0 1px 5px colors.$gray;
        }
    }
</style>
