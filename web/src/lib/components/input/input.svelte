<script lang="ts">
    export let name: string;
    export let value: string;
    export let placeholder: string;
</script>

<input class="element" type="text" {name} {value} {placeholder} data-1p-ignore />

<style lang="scss">
    @use '../../../styles/colors';
    @use '../../../styles/typography';

    .element {
        @include typography.brand-face;
        @include typography.size-16;
        padding: 7px 10px;
        border-radius: 6px;
        border: 1px solid colors.$lightgray;
        transition: box-shadow 0.1s;

        &:focus {
            box-shadow: inset 0 1px 5px colors.$lightgray;
        }
    }
</style>
