<script lang="ts">
    export let id: string | undefined = undefined;
    export let name: string | undefined = undefined;
    export let value: string;
    export let placeholder: string | undefined = undefined;
</script>

<textarea {id} {name} {value} {placeholder} class="element" />

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
