<script lang="ts">
    import {Root as PopoverRoot, Content, Trigger} from '$lib/components/ui/popover';
    import {Button} from '$lib/components/ui/button';
    import {MARKER_ICON_KEYS} from '$lib/services/map/markerStyling.data';
    import {markerIconMap, type MarkerIconKey} from '$lib/services/map/markerStyling';
    import MarkerIcon from '$lib/components/map/markerIcon.svelte';
    import type {MarkerIcon as MarkerIconType} from '$lib/interfaces/marker';

    interface Props {
        value: MarkerIconKey;
        onchange: (icon: MarkerIconKey) => void;
    }

    let {value, onchange}: Props = $props();
    let isOpen = $state(false);

    const activeIcon = $derived(markerIconMap[value]);

    function handleSelect(key: MarkerIconKey) {
        onchange(key);
        isOpen = false;
    }
</script>

<PopoverRoot bind:open={isOpen}>
    <Trigger>
        {#snippet child({props})}
            <Button {...props} variant="outline" size="sm" class="h-8 gap-1.5 px-2.5 text-xs">
                {#if activeIcon}
                    <MarkerIcon
                        icon={activeIcon.component as MarkerIconType}
                        className="{activeIcon.className} size-3.5 text-foreground"
                    />
                {/if}
                Иконка
            </Button>
        {/snippet}
    </Trigger>
    <Content class="w-68 p-2" align="start" sideOffset={8}>
        <div class="grid grid-cols-6 gap-1">
            {#each MARKER_ICON_KEYS as key (key)}
                {@const icon = markerIconMap[key]}
                <button
                    type="button"
                    class="flex size-9 items-center justify-center rounded-md transition-colors {value ===
                    key
                        ? 'bg-primary/15 text-primary ring-primary/30 ring-1'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'}"
                    onclick={() => handleSelect(key)}
                    aria-label={key}
                >
                    <MarkerIcon
                        icon={icon.component as MarkerIconType}
                        className="{icon.className} size-4"
                    />
                </button>
            {/each}
        </div>
    </Content>
</PopoverRoot>
