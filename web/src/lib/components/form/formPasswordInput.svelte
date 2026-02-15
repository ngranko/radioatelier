<script lang="ts">
    import PasswordInput from '$lib/components/input/passwordInput.svelte';
    import ErrorableLabel from '$lib/components/errorableLabel.svelte';

    interface Props {
        id?: string | undefined;
        name?: string | undefined;
        value?: string;
        placeholder?: string | undefined;
        required?: boolean;
        label?: string | undefined;
        error?: string[] | null | undefined;
    }

    let {
        id = undefined,
        name = undefined,
        value = '',
        placeholder = undefined,
        required = false,
        label = undefined,
        error = undefined,
    }: Props = $props();
</script>

<div>
    <ErrorableLabel for={id} class="mb-1" {error}>
        {label}
    </ErrorableLabel>
    <PasswordInput {id} {name} {value} {required} {placeholder} />
</div>
