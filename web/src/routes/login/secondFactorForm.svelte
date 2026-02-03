<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import {Label} from '$lib/components/ui/label';
    import {Input} from '$lib/components/ui/input';
    import LoadingDots from './loadingDots.svelte';

    interface Props {
        verificationCode: string;
        submitting: boolean;
        error?: string;
        onsubmit: (event: SubmitEvent) => void;
        onback: () => void;
    }

    let {verificationCode = $bindable(), submitting, error, onsubmit, onback}: Props = $props();
</script>

<form {onsubmit} class="flex flex-col gap-5">
    <p class="text-muted-foreground text-center text-sm">
        Код подтверждения отправлен на вашу почту
    </p>
    <div class="space-y-2">
        <Label for="code">Код подтверждения</Label>
        <Input
            id="code"
            type="text"
            inputmode="numeric"
            placeholder="123456"
            class="focus-visible:border-primary focus-visible:ring-primary/30"
            bind:value={verificationCode}
        />
        {#if error}
            <p class="text-destructive text-sm">{error}</p>
        {/if}
    </div>
    <div class="mt-2">
        <Button type="submit" class="w-full text-base" disabled={submitting}>
            {#if submitting}
                <LoadingDots />
            {:else}
                Подтвердить
            {/if}
        </Button>
    </div>
    <Button type="button" variant="ghost" class="text-sm" onclick={onback}>Назад</Button>
</form>
