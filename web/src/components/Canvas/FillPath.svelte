<script lang="ts">
    import {getContext, onDestroy, onMount} from "svelte";
    import type {CanvasContext} from "../../types/canvas";

    export let path: string;
    export let color: string;

    let canvasContext = getContext('canvas') as CanvasContext;

    onMount(() => {
        canvasContext.addDrawFn(draw);
    });

    onDestroy(() => {
        canvasContext.removeDrawFn(draw);
    });

    function draw(ctx: CanvasRenderingContext2D) {
        const prevStyle = ctx.fillStyle;

        ctx.fillStyle = color;
        ctx.fill(new Path2D(path));

        ctx.fillStyle = prevStyle;
    }
</script>
