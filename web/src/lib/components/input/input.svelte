<script lang="ts">
    interface Props {
        id?: string | undefined;
        name?: string | undefined;
        type?: 'text' | 'email' | 'password';
        value?: string;
        placeholder?: string | undefined;
        required?: boolean;
    }

    let {
        id = undefined,
        name = undefined,
        type = 'text',
        value = '',
        placeholder = undefined,
        required = false,
    }: Props = $props();
</script>

<input class="element" {type} {id} {name} {value} {placeholder} data-1p-ignore {required} />

<style lang="scss">
    @use '../../../styles/colors';
    @use '../../../styles/typography';

    .element {
        @include typography.brand-face;
        @include typography.size-16;
        padding: 7px 10px;
        border-radius: 6px;
        border: 1px solid colors.$gray;
        transition: box-shadow 0.2s;

        &:focus {
            box-shadow: inset 0 1px 5px colors.$gray;
        }
    }
</style>
