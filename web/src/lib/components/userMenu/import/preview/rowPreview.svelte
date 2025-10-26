<script lang="ts">
    import {importState} from '$lib/state/import.svelte.ts';
</script>

<div class="space-y-2">
    <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold">Превью</h3>
        <span class="text-muted-foreground text-sm">первые 2 строки</span>
    </div>
    <div class="bg-card overflow-x-scroll rounded-lg border">
        <table class="w-full">
            <tbody class="font-mono text-xs">
                {#each importState.preview as row}
                    <tr class="border-b last:border-0">
                        {#each row as cell}
                            <td
                                class="text-muted-foreground max-w-40 overflow-hidden px-4 py-3 text-nowrap overflow-ellipsis"
                            >
                                {cell}
                            </td>
                        {/each}
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>
