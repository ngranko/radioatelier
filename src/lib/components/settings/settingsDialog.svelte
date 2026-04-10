<script lang="ts">
    import {Root as DialogRoot, Content, Title, Footer} from '$lib/components/ui/dialog';
    import {DialogClose} from '$lib/components/ui/dialog/index.js';
    import {Button} from '$lib/components/ui/button';
    import {goto} from '$app/navigation';
    import {useConvexClient} from 'convex-svelte';
    import {api} from '$convex/_generated/api';
    import {toast} from 'svelte-sonner';
    import type {Id} from '$convex/_generated/dataModel';
    import CategoryStyleEditor from './categoryStyleEditor.svelte';
    import {Input} from '$lib/components/ui/input';
    import PaletteIcon from '@lucide/svelte/icons/palette';
    import SearchIcon from '@lucide/svelte/icons/search';
    import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
    import type {Category} from '$lib/interfaces/category';
    import {categoriesState} from '$lib/state/categories.svelte';
    import {onDestroy} from 'svelte';
    import {MARKER_ICON_KEYS, markerColorMap} from '$lib/services/map/markerStyling';

    const DIALOG_ANIMATION_DURATION = 200;

    interface Props {
        isOpen: boolean;
    }

    type StyleState = Pick<Category, 'markerColor' | 'markerIcon' | 'isHidden'>;

    interface EditEntry {
        original: StyleState;
        current: StyleState;
    }

    let {isOpen = $bindable()}: Props = $props();

    const client = useConvexClient();

    let edits: Record<string, EditEntry> = $state({});
    let isSaving = $state(false);
    let searchQuery = $state('');
    let closeRedirectTimer: ReturnType<typeof setTimeout> | undefined;

    const categoryList = $derived(
        [...categoriesState.list].sort((a, b) => a.name.localeCompare(b.name)),
    );
    const filteredCategories = $derived(
        searchQuery.trim()
            ? categoryList.filter(c =>
                  c.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
              )
            : categoryList,
    );

    function getDisplayStyle(id: Id<'categories'>): StyleState {
        if (edits[id]) {
            return edits[id].current;
        }

        const category = categoriesState.categories[id];
        if (!category) {
            return {
                markerColor: markerColorMap[0],
                markerIcon: MARKER_ICON_KEYS[0],
                isHidden: false,
            };
        }

        return {
            markerColor: category.markerColor,
            markerIcon: category.markerIcon,
            isHidden: category.isHidden,
        };
    }

    function isEdited(id: Id<'categories'>): boolean {
        const entry = edits[id];
        if (!entry) {
            return false;
        }
        const {original: o, current: c} = entry;
        return (
            o.markerColor !== c.markerColor ||
            o.markerIcon !== c.markerIcon ||
            o.isHidden !== c.isHidden
        );
    }

    function handleUpdate(id: Id<'categories'>, patch: Partial<StyleState>) {
        const category = categoriesState.categories[id];
        if (!category) {
            return;
        }

        const current = edits[id]?.current ?? {
            markerColor: category.markerColor,
            markerIcon: category.markerIcon,
            isHidden: category.isHidden,
        };
        const updated = {...current, ...patch};

        if (!edits[id]) {
            edits[id] = {
                original: {
                    markerColor: category.markerColor,
                    markerIcon: category.markerIcon,
                    isHidden: category.isHidden,
                },
                current: updated,
            };
        } else {
            edits[id].current = updated;
        }
    }

    $effect(() => {
        console.log(categoriesState.list);
        console.log(categoriesState.categories);
    });

    const changedEntries = $derived.by(() => {
        return Object.entries(edits)
            .filter(([id]) => isEdited(id as Id<'categories'>))
            .map(([id, entry]) => ({categoryId: id as Id<'categories'>, ...entry.current}));
    });
    const hasChanges = $derived(changedEntries.length > 0);

    async function handleSave() {
        if (!hasChanges) {
            return;
        }
        isSaving = true;

        try {
            await client.mutation(api.categories.updateStyles, {styles: changedEntries});
            edits = {};
            toast.success('Настройки маркеров сохранены');
            setIsOpen(false);
        } catch {
            toast.error('Не удалось сохранить настройки');
        } finally {
            isSaving = false;
        }
    }

    function getIsOpen() {
        return isOpen;
    }

    function clearCloseRedirectTimer() {
        if (closeRedirectTimer !== undefined) {
            clearTimeout(closeRedirectTimer);
            closeRedirectTimer = undefined;
        }
    }

    function setIsOpen(newOpen: boolean) {
        clearCloseRedirectTimer();
        isOpen = newOpen;

        if (!newOpen) {
            edits = {};
            searchQuery = '';
            closeRedirectTimer = setTimeout(() => {
                closeRedirectTimer = undefined;
                goto('/');
            }, DIALOG_ANIMATION_DURATION);
        }
    }

    function preventCloseWhileSaving(event: Event) {
        if (isSaving) {
            event.preventDefault();
        }
    }

    onDestroy(() => {
        clearCloseRedirectTimer();
    });
</script>

<!-- prettier-ignore -->
<DialogRoot bind:open={getIsOpen, setIsOpen}>
    <Content
        class="flex max-h-[85vh] flex-col overflow-hidden border-t-0 p-0 sm:max-w-lg"
        onEscapeKeydown={preventCloseWhileSaving}
        onInteractOutside={preventCloseWhileSaving}
    >
        <div
            class="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-primary via-primary/60 to-transparent"
        ></div>
        <div class="relative shrink-0 px-6 pt-6 pb-4">
            <div
                class="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-primary/[0.03] to-transparent"
            ></div>
            <div class="relative flex items-center gap-3.5">
                <div
                    class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20"
                >
                    <PaletteIcon class="size-4.5 text-primary" />
                </div>
                <div>
                    <Title class="text-lg font-semibold tracking-[-0.01em]">
                        Настройки категорий
                    </Title>
                    <p class="text-muted-foreground mt-0.5 text-xs leading-snug">
                        Настройте цвет, иконку и доступность категорий
                    </p>
                </div>
            </div>
        </div>

        <div class="shrink-0 px-6 pb-3">
            <div class="relative">
                <SearchIcon class="text-muted-foreground/50 pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
                <Input
                    type="text"
                    placeholder="Поиск категорий..."
                    class="pl-10"
                    bind:value={searchQuery}
                />
            </div>
        </div>

        <div class="min-h-0 grow overflow-y-auto px-6">
            <div class="space-y-2.5 pb-4">
                {#each filteredCategories as category (category.id)}
                    <CategoryStyleEditor
                        name={category.name}
                        style={getDisplayStyle(category.id)}
                        isChanged={isEdited(category.id)}
                        onupdate={patch => handleUpdate(category.id, patch)}
                    />
                {/each}

                {#if filteredCategories.length === 0}
                    <div class="py-8 text-center text-sm text-muted-foreground">
                        Ничего не найдено
                    </div>
                {/if}
            </div>
        </div>

        <Footer class="border-border/50 shrink-0 gap-3 border-t bg-muted/20 px-6 py-4">
            <DialogClose disabled={isSaving} class="mr-2">Закрыть</DialogClose>
            <Button
                variant="default"
                disabled={isSaving || !hasChanges}
                class="min-w-28"
                onclick={handleSave}
            >
                {#if isSaving}
                    <LoaderCircleIcon class="size-4 animate-spin" />
                {:else}
                    Сохранить
                {/if}
            </Button>
        </Footer>
    </Content>
</DialogRoot>
