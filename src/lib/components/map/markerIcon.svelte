<script lang="ts">
    import type {MarkerIcon} from '$lib/interfaces/marker';

    interface Props {
        icon: MarkerIcon;
        className?: string;
    }

    let {icon, className = ''}: Props = $props();
</script>

{#if typeof icon === 'string'}
    <i class={`${icon} ${className}`.trim()}></i>
{:else}
    {@const Icon = icon}
    <Icon class={className} />
{/if}
