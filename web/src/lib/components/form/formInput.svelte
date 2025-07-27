<script lang="ts">
    import {Input} from '$lib/components/ui/input';
    import ErrorableLabel from '../errorableLabel.svelte';

    interface Props {
        id?: string | undefined;
        name?: string | undefined;
        type?: 'text' | 'email' | 'password';
        value?: string;
        placeholder?: string | undefined;
        required?: boolean;
        label?: string | undefined;
        error?: string[] | null | undefined;
    }

    let {
        id = undefined,
        name = undefined,
        type = 'text',
        value = '',
        placeholder = undefined,
        required = false,
        label = undefined,
        error = undefined,
    }: Props = $props();
</script>

<div>
    <ErrorableLabel for={id} {error}>
        {label}
    </ErrorableLabel>
    <Input {id} {type} {name} {value} {required} {placeholder} />
</div>
