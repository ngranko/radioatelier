<script lang="ts">
    import Canvas from './Canvas/Canvas.svelte';
    import FillPathWithShadow from './Canvas/FillPathWithShadow.svelte';
    import {
        animationTemplate,
        aSilouette,
        atelierSilouette,
        defaultHeight,
        defaultWidth,
        dSilouette,
        iSilouette,
        oSilouette,
        outerPerimeter,
        rSilouette
    } from '../models/logo';
    import type {AnimationFraming} from '../types/canvas';

    interface LogoAnimationConfig {
        perimeter: AnimationFraming;
        atelier: AnimationFraming;
        r: AnimationFraming;
        a: AnimationFraming;
        d: AnimationFraming;
        i: AnimationFraming;
        o: AnimationFraming;
    }

    let animationDuration = 0;

    const animations: LogoAnimationConfig = {
        perimeter: makeAnimationFraming(),
        atelier: makeAnimationFraming(),
        r: makeAnimationFraming(),
        a: makeAnimationFraming(),
        d: makeAnimationFraming(),
        i: makeAnimationFraming(),
        o: makeAnimationFraming(),
    };

    function makeAnimationFraming(): AnimationFraming {
        const duration = Math.random() * 4 * 1000;

        if (duration > animationDuration) {
            animationDuration = duration;
        }

        return calculateAnimationFraming(duration);
    }

    function calculateAnimationFraming(duration: number): AnimationFraming {
        const result = [];

        for (const element in animationTemplate) {
            result[element] = {...animationTemplate[element], t: animationTemplate[element].t * duration};
        }

        return result
    }
</script>

<Canvas
    class="logoLight"
    width={defaultWidth}
    height={defaultHeight}
    translate={[40, 40]}
    animate
    duration={animationDuration}
>
    <FillPathWithShadow path={outerPerimeter} color="white" shadowColor="#0097ff" opacity={animations.perimeter} />
    <FillPathWithShadow path={atelierSilouette} color="white" shadowColor="#0097ff" opacity={animations.atelier} />
    <FillPathWithShadow path={rSilouette} color="white" shadowColor="#fcbb3d" opacity={animations.r} />
    <FillPathWithShadow path={aSilouette} color="white" shadowColor="#fcbb3d" opacity={animations.a} />
    <FillPathWithShadow path={dSilouette} color="white" shadowColor="#fcbb3d" opacity={animations.d} />
    <FillPathWithShadow path={iSilouette} color="white" shadowColor="#fcbb3d" opacity={animations.i} />
    <FillPathWithShadow path={oSilouette} color="white" shadowColor="#fcbb3d" opacity={animations.o} />
</Canvas>

<style lang="scss">
    :global(.logoLight) {
        position: absolute;
        top: 0;
        left: 0;
    }
</style>
