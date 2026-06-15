<script lang="ts">
    import type {LooseObject} from '$lib/interfaces/object.ts';
    import Form from '$lib/components/objectDetails/objectForm/form.svelte';

    interface Props {
        initialValues: Partial<LooseObject>;
        registerCloseConfirmationCheck?: (check: () => boolean) => () => void;
    }

    let {initialValues, registerCloseConfirmationCheck}: Props = $props();
</script>

<Form {initialValues} {registerCloseConfirmationCheck} />
