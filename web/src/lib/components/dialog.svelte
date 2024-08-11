<script lang="ts">
    export let isOpen: boolean = false;
    let prevOpen: boolean = isOpen;
    let dialog: HTMLDialogElement;

    $: if (prevOpen !== isOpen) {
        prevOpen = isOpen;

        if (isOpen) {
            dialog.showModal();
        } else {
            dialog.close();
        }
    }
</script>

<dialog bind:this={dialog} class="dialog">
    <slot />
</dialog>

<style lang="scss">
    .dialog {
        border: 0;
        border-radius: 8px;
        opacity: 0;
        transition: 0.2s ease-out allow-discrete;

        &[open] {
            opacity: 1;
        }

        &::backdrop {
            background-color: rgb(0 0 0 / 0%);
            transition: 0.2s ease-out allow-discrete;
        }

        &[open]::backdrop {
            background-color: rgb(0 0 0 / 25%);
        }
    }

    // will be supported in svelte 5
    @starting-style {
        .dialog[open] {
            opacity: 0;
        }

        .dialog[open]::backdrop {
            background-color: rgb(0 0 0 / 0%);
        }
    }
</style>
