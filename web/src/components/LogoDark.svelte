<script lang="ts">
    import Canvas from './Canvas/Canvas.svelte';
    import FillPath from './Canvas/FillPath.svelte';
    import {
        aSilouette,
        atelierBackground,
        atelierSilouette,
        defaultHeight,
        defaultWidth,
        dSilouette,
        iSilouette,
        oSilouette,
        outerPerimeter,
        radioBackground,
        rSilouette,
        supportLines
    } from '../models/logo';
    import StrokePath from './Canvas/StrokePath.svelte';
</script>

<Canvas width={defaultWidth} height={defaultHeight} translate={[40, 40]}>
    <StrokePath path="{supportLines}" color="#1d1d1b"/>
    <FillPath path="{outerPerimeter}" color="#1d1d1b"/>
    <FillPath path="{atelierBackground}" color="#393939"/>
    <FillPath path="{radioBackground}" color="#393939"/>
    <FillPath path="{atelierSilouette}" color="#1d1d1b"/>
    <FillPath path="{rSilouette}" color="#1d1d1b"/>
    <FillPath path="{aSilouette}" color="#1d1d1b"/>
    <FillPath path="{dSilouette}" color="#1d1d1b"/>
    <FillPath path="{iSilouette}" color="#1d1d1b"/>
    <FillPath path="{oSilouette}" color="#1d1d1b"/>
</Canvas>
