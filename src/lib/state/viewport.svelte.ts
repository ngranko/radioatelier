interface ViewportMetrics {
    height: number;
    offsetTop: number;
}

const metrics = $state<ViewportMetrics>({height: 0, offsetTop: 0});

// Read-only view: the values are owned by the listeners below, and a height of
// 0 means nothing has measured the viewport yet (server render, first paint).
export const viewportMetrics = {
    get height() {
        return metrics.height;
    },
    get offsetTop() {
        return metrics.offsetTop;
    },
};

let trackerCount = 0;

export function trackViewportMetrics(): () => void {
    if (typeof window === 'undefined') {
        return () => {};
    }

    trackerCount += 1;
    if (trackerCount === 1) {
        readMetrics();
        window.visualViewport?.addEventListener('resize', readMetrics);
        window.visualViewport?.addEventListener('scroll', readMetrics);
        window.addEventListener('resize', readMetrics);
    }

    let stopped = false;

    return () => {
        if (stopped) {
            return;
        }

        stopped = true;
        trackerCount -= 1;
        if (trackerCount > 0) {
            return;
        }

        window.visualViewport?.removeEventListener('resize', readMetrics);
        window.visualViewport?.removeEventListener('scroll', readMetrics);
        window.removeEventListener('resize', readMetrics);
    };
}

function readMetrics() {
    const visual = window.visualViewport;
    metrics.height = Math.round(visual?.height ?? window.innerHeight);
    metrics.offsetTop = Math.round(visual?.offsetTop ?? 0);
}
