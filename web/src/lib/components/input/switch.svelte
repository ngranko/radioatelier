<script lang="ts">
    export let id: string | undefined = undefined;
    export let name: string | undefined = undefined;
    export let checked = false;
    export let label: string | undefined = undefined;
</script>

<label for={id} class="label">
    <span class="switch">
        <input type="checkbox" {id} {name} bind:checked value="1" />
        <span class="slider" />
    </span>
    {label}
</label>

<style lang="scss">
    @use '../../../styles/colors';

    .switch {
        position: relative;
        display: inline-block;
        width: 40px;
        height: 24px;
    }

    .switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: colors.$lightgray;
        transition: 0.2s;
        border-radius: 24px;
    }

    .slider:before {
        position: absolute;
        content: '';
        height: 20px;
        width: 20px;
        left: 2px;
        bottom: 2px;
        background-color: colors.$white;
        transition: 0.2s;
        border-radius: 50%;
    }

    input:checked + .slider {
        background-color: colors.$primary;
    }

    input:checked + .slider {
        box-shadow: 0 0 1px colors.$primary;
    }

    input:checked + .slider:before {
        transform: translateX(16px);
    }
</style>
