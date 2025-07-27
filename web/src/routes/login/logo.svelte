<script lang="ts">
    import {clsx} from 'clsx';

    interface Props {
        class?: string;
    }

    let {class: className}: Props = $props();
</script>

<div class={clsx(['gap-3 text-3xl', className])}>
    <img src="/logo.svg" class="h-8" alt="logo" />
    <span class="separator">.</span>
    <span class="name">архив</span>
</div>
