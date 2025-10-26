<script lang="ts">
    import {Label} from '$lib/components/ui/label';
    import {Label as LabelPrimitive} from 'bits-ui';
    import {cn} from '$lib/utils.ts';

    interface Props extends LabelPrimitive.RootProps {
        error: string[] | null | undefined;
    }

    let {error, children, class: className, ...rest}: Props = $props();
    let isError: boolean = $derived(Boolean(error));
</script>

<Label {...rest} class={cn(['transition-colors', className, {'text-destructive': isError}])}>
    {#if error}
        {error[0]}
    {:else}
        {@render children?.()}
    {/if}
</Label>
