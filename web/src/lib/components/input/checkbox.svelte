<script lang="ts">
    interface Props {
        id?: string | undefined;
        name?: string | undefined;
        checked?: boolean | undefined;
        label?: string | undefined;
    }

    let {
        id = undefined,
        name = undefined,
        checked = false,
        label = undefined
    }: Props = $props();
</script>

{#if label}
    <label for={id} class="label">
        <input type="checkbox" {id} {name} value="1" class="element labelled" {checked} />
        {label}
    </label>
{:else}
    <input type="checkbox" {id} {name} value="1" class="element" {checked} />
{/if}

<style lang="scss">
    @use '../../../styles/colors';
    @use '../../../styles/typography';

    .label {
        display: flex;
        align-items: center;
    }

    .element {
        appearance: none;
        position: relative;
        width: 20px;
        height: 20px;
        border: 1px solid colors.$gray;
        border-radius: 2px;
        cursor: pointer;

        &:checked {
            &:before {
                position: absolute;
                content: '';
                display: block;
                width: 4px;
                height: 8px;
                border-bottom: 2px solid colors.$primary;
                border-right: 2px solid colors.$primary;
                transform: rotate(45deg);
                left: 6px;
                top: 3px;
            }
        }
    }

    .labelled {
        margin-right: 8px;
    }
</style>
