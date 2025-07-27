<script lang="ts">
    import {clsx} from 'clsx';
    import {Label} from '$lib/components/ui/label';
    import {Label as LabelPrimitive} from 'bits-ui';

    interface Props extends LabelPrimitive.RootProps {
        error: string[] | null | undefined;
    }

    let {error, children, class: className, ...rest}: Props = $props();
    let isError: boolean = $derived(Boolean(error));
</script>

<Label {...rest} class={clsx(['transition-colors', className, {'text-destructive': isError}])}>
    {#if error}
        {error[0]}
    {:else}
        {@render children?.()}
    {/if}
</Label>
