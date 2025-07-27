<script lang="ts">
    import PasswordInput from '$lib/components/input/passwordInput.svelte';
    import ErrorableLabel from '../errorableLabel.svelte';

    interface Props {
        id?: string | undefined;
        name?: string | undefined;
        value?: string;
        placeholder?: string | undefined;
        required?: boolean;
        label?: string | undefined;
        error?: string[] | null | undefined;
        withStrengthIndicator?: boolean;
    }

    let {
        id = undefined,
        name = undefined,
        value = '',
        placeholder = undefined,
        required = false,
        label = undefined,
        error = undefined,
        withStrengthIndicator = false,
    }: Props = $props();
</script>

<div>
    <ErrorableLabel for={id} {error}>
        {label}
    </ErrorableLabel>
    <PasswordInput {id} {name} {value} {required} {placeholder} {withStrengthIndicator} />
</div>
