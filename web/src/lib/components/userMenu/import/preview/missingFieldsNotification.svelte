<script lang="ts">
    interface Props {
        count: number;
    }

    let {count}: Props = $props();
</script>

<div class="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
    <p class="text-sm font-medium text-amber-900">
        {count}
        {count === 1 ? 'обязательное поле' : 'обязательных поля'} не выбрано
    </p>
    <p class="mt-1 text-sm text-amber-800/80">
        Пожалуйста, выберите все обязательные поля перед импортом
    </p>
</div>
