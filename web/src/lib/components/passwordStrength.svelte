<script lang="ts">
    import {clsx} from 'clsx';
    import {getPasswordScore} from '$lib/services/passwordStrength';

    const SCORE_VERY_LOW = 0;
    const SCORE_LOW = 1;
    const SCORE_MEDIUM = 2;
    const SCORE_HIGH = 3;
    const SCORE_VERY_HIGH = 4;

    interface Props {
        value?: string;
    }

    let {value = ''}: Props = $props();

    let passwordScore: Number = $derived(getPasswordScore(value));
    let classNames: string = $derived(
        clsx({
            'w-full h-0.5 mt-2 flex rounded-sm bg-gray-100 after:block after:duration-200 after:ease-in-out': true,
            'after:bg-destructive after:w-1/20': passwordScore === SCORE_VERY_LOW,
            'after:bg-destructive after:w-1/4': passwordScore === SCORE_LOW,
            'after:bg-sky-600 after:w-1/2': passwordScore === SCORE_MEDIUM,
            'after:bg-sky-600 after:w-3/4': passwordScore === SCORE_HIGH,
            'after:bg-sky-600 after:w-full': passwordScore === SCORE_VERY_HIGH,
        }),
    );
</script>

<div class={classNames}></div>
