<script lang="ts">
    import {api} from '$convex/_generated/api';
    import {Button} from '$lib/components/ui/button';
    import {Input} from '$lib/components/ui/input';
    import {countAvailableCaptures, PHOTO_CAPTURES_PER_HOUR} from '$lib/utils/photoCaptureQuota';
    import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
    import {useConvexClient, useQuery} from 'convex-svelte';
    import {toast} from 'svelte-sonner';

    const client = useConvexClient();
    const quota = useQuery(api.photoCaptures.getQuota, {});

    let isEditing = $state(false);
    let isBusy = $state(false);
    let draftKey = $state('');

    async function connectKey(event: SubmitEvent) {
        event.preventDefault();
        isBusy = true;
        try {
            await client.action(api.openRouterKeys.connect, {apiKey: draftKey});
            isEditing = false;
            draftKey = '';
            toast.success('Ключ подключён');
        } catch (error) {
            console.error('Failed to connect the OpenRouter key:', error);
            toast.error('OpenRouter не принял этот ключ');
        } finally {
            isBusy = false;
        }
    }

    async function disconnectKey() {
        isBusy = true;
        try {
            await client.mutation(api.openRouterKeys.disconnect, {});
        } finally {
            isBusy = false;
        }
    }
</script>

{#if quota.data}
    <section class="bg-muted/60 rounded-xl p-3">
        {#if quota.data.isUnlimited}
            <div class="flex items-center gap-3">
                <CircleCheckIcon class="text-primary size-5 shrink-0" />
                <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium">Свой ключ OpenRouter подключён</p>
                    <p class="text-muted-foreground text-xs">Распознавание без лимита</p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    class="text-sm"
                    disabled={isBusy}
                    onclick={disconnectKey}
                >
                    Отключить
                </Button>
            </div>
        {:else}
            <div class="flex items-center gap-3">
                <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium">Свой ключ OpenRouter</p>
                    <p class="text-muted-foreground text-xs">
                        Без ключа — {PHOTO_CAPTURES_PER_HOUR} фото в час. Осталось {countAvailableCaptures(
                            quota.data,
                        )}.
                    </p>
                </div>
                {#if !isEditing}
                    <Button
                        variant="outline"
                        size="sm"
                        class="text-sm"
                        onclick={() => (isEditing = true)}
                    >
                        Подключить
                    </Button>
                {/if}
            </div>
            {#if isEditing}
                <form class="mt-3 flex gap-2" onsubmit={connectKey}>
                    <Input
                        type="password"
                        placeholder="sk-or-…"
                        autocomplete="off"
                        aria-label="Ключ OpenRouter"
                        class="bg-background h-8"
                        bind:value={draftKey}
                    />
                    <Button
                        type="submit"
                        size="sm"
                        class="text-sm"
                        loading={isBusy}
                        disabled={!draftKey.trim()}
                    >
                        Сохранить
                    </Button>
                </form>
            {/if}
        {/if}
    </section>
{/if}
