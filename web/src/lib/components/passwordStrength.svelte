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
            base: true,
            veryLow: passwordScore === SCORE_VERY_LOW,
            low: passwordScore === SCORE_LOW,
            medium: passwordScore === SCORE_MEDIUM,
            high: passwordScore === SCORE_HIGH,
            veryHigh: passwordScore === SCORE_VERY_HIGH,
        }),
    );
</script>

<div class={classNames}></div>

<style lang="scss">
    @use '../../styles/colors';

    .base {
        width: 100%;
        height: 2px;
        margin-top: 8px;
        border-radius: 5px;
        display: flex;
        background: colors.$lightgray;

        &::after {
            display: block;
            content: '';
            background: colors.$primary;
            transition: 0.2s ease-in-out;
        }
    }

    .veryLow {
        &::after {
            background: colors.$danger;
            width: 5%;
        }
    }

    .low {
        &::after {
            background: colors.$danger;
            width: 25%;
        }
    }

    .medium {
        &::after {
            width: 50%;
        }
    }

    .high {
        &::after {
            width: 75%;
        }
    }

    .veryHigh {
        &::after {
            width: 100%;
        }
    }
</style>
