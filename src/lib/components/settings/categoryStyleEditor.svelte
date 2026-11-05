<script lang="ts">
    import {Checkbox} from '$lib/components/ui/checkbox';
    import type {Category} from '$lib/interfaces/category';
    import EyeOffIcon from '@lucide/svelte/icons/eye-off';
    import ColorPicker from './colorPicker.svelte';
    import IconPicker from './iconPicker.svelte';
    import MarkerPreview from './markerPreview.svelte';

    type CategoryStyle = Pick<Category, 'markerColor' | 'markerIcon' | 'isHidden'>;

    interface Props {
        name: string;
        style: CategoryStyle;
        isChanged: boolean;
        onupdate: (patch: Partial<CategoryStyle>) => void;
    }

    let {name, style, isChanged, onupdate}: Props = $props();
</script>

<div
    class="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2.5 rounded-xl border p-3 transition-all duration-200 sm:gap-y-3 sm:p-3.5 {isChanged
        ? 'border-primary/30 bg-primary/3 shadow-sm'
        : 'border-border/60 bg-card hover:border-border'}"
>
    <MarkerPreview color={style.markerColor} iconKey={style.markerIcon} />
    <div class="flex min-w-0 items-center gap-2">
        <span class="line-clamp-2 text-sm font-medium wrap-break-word" title={name}>
            {name}
        </span>
        {#if style.isHidden}
            <EyeOffIcon class="text-muted-foreground size-3.5 shrink-0" aria-label="Скрыта" />
        {/if}
        {#if isChanged}
            <span
                class="bg-primary/10 text-primary shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium"
            >
                изменено
            </span>
        {/if}
    </div>

    <div
        class="col-span-2 space-y-2.5 sm:col-span-1 sm:col-start-2 sm:space-y-3 max-sm:pointer-coarse:space-y-1"
    >
        <ColorPicker value={style.markerColor} onchange={color => onupdate({markerColor: color})} />
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
            <IconPicker value={style.markerIcon} onchange={icon => onupdate({markerIcon: icon})} />
            <label
                class="flex cursor-pointer items-center gap-2 text-sm/snug select-none pointer-coarse:min-h-11"
            >
                <Checkbox
                    checked={style.isHidden}
                    onCheckedChange={checked => onupdate({isHidden: Boolean(checked)})}
                />
                Скрыть из списка
            </label>
        </div>
    </div>
</div>
