<script lang="ts">
    import {getContext, onDestroy, onMount} from 'svelte';
    import type {AnimationFraming, CanvasContext} from '../../types/canvas';

    export let path: string;
    export let color: string;
    export let shadowColor: string;
    export let opacity: number | AnimationFraming;

    let canvasContext = getContext('canvas') as CanvasContext;

    onMount(() => {
        canvasContext.addDrawFn(draw);
    });

    onDestroy(() => {
        canvasContext.removeDrawFn(draw);
    });

    function getOpacity(): number {
        if (typeof opacity === 'number') {
            return opacity;
        }

        return canvasContext.getAnimatedValue(opacity);
    }

    function draw(ctx: CanvasRenderingContext2D) {
        const prevStyle = ctx.fillStyle;
        ctx.globalAlpha = getOpacity();

        const drawablePath = new Path2D(path);

        ctx.fillStyle = color;
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = 40;
        ctx.fill(drawablePath);
        ctx.shadowBlur = 34;
        ctx.fill(drawablePath);
        ctx.shadowBlur = 30;
        ctx.fill(drawablePath);
        ctx.shadowBlur = 27;
        ctx.fill(drawablePath);
        ctx.shadowBlur = 14;
        ctx.fill(drawablePath);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.shadowBlur = 0;
        ctx.fill(drawablePath);
        ctx.globalCompositeOperation = 'source-over';
        ctx.shadowColor = color;
        ctx.shadowBlur = 3;
        ctx.fill(drawablePath);

        ctx.globalAlpha = 1;
        ctx.fillStyle = prevStyle;
    }
</script>
