<script lang="ts">
    import MarkerPreview from './markerPreview.svelte';
    import ColorPicker from './colorPicker.svelte';
    import IconPicker from './iconPicker.svelte';
    import {Checkbox} from '$lib/components/ui/checkbox';
    import ListXIcon from '@lucide/svelte/icons/list-x';

    interface CategoryStyle {
        markerColor: string;
        markerIcon: string;
        isHidden: boolean;
    }

    interface Props {
        name: string;
        style: CategoryStyle;
        isChanged: boolean;
        onupdate: (patch: Partial<CategoryStyle>) => void;
    }

    let {name, style, isChanged, onupdate}: Props = $props();
</script>

<div
    class="group rounded-xl border p-3.5 transition-all duration-200 {isChanged
        ? 'border-primary/30 bg-primary/[0.03] shadow-sm'
        : 'border-border/60 bg-card hover:border-border'}"
>
    <div class="flex items-center gap-3">
        <MarkerPreview color={style.markerColor} iconKey={style.markerIcon} />
        <div class="min-w-0 grow">
            <div class="flex items-center gap-2">
                <span
                    class="truncate text-sm font-medium capitalize {style.isHidden
                        ? 'text-muted-foreground line-through'
                        : ''}"
                >
                    {name}
                </span>
                {#if isChanged}
                    <span
                        class="bg-primary/10 text-primary shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium"
                    >
                        изменено
                    </span>
                {/if}
            </div>
            <div class="mt-2">
                <ColorPicker
                    value={style.markerColor}
                    onchange={color => onupdate({markerColor: color})}
                />
            </div>
        </div>
    </div>

    <div class="border-border/40 mt-3 flex items-center justify-between border-t pt-3">
        <IconPicker value={style.markerIcon} onchange={icon => onupdate({markerIcon: icon})} />
        <div class="flex flex-col items-end gap-1">
            <label class="flex cursor-pointer items-center gap-2 select-none">
                <ListXIcon class="text-muted-foreground size-3.5" />
                <span class="text-muted-foreground text-xs">Скрыть из списка</span>
                <Checkbox
                    checked={style.isHidden}
                    onCheckedChange={checked => onupdate({isHidden: Boolean(checked)})}
                />
            </label>
            {#if style.isHidden}
                <span class="text-muted-foreground/70 text-xs leading-tight">
                    Не будет показана при выборе категории
                </span>
            {/if}
        </div>
    </div>
</div>
