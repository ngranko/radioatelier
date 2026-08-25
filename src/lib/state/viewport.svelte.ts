interface ViewportMetrics {
    height: number;
    keyboardInset: number;
}

const metrics = $state<ViewportMetrics>({height: 0, keyboardInset: 0});

// Read-only view: the values are owned by the listeners below, and a height of
// 0 means nothing has measured the viewport yet (server render, first paint).
export const viewportMetrics = {
    get height() {
        return metrics.height;
    },
    get keyboardInset() {
        return metrics.keyboardInset;
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

// Mobile browsers answer an open keyboard by shrinking the visual viewport and
// panning the page, while the layout viewport (and with it dvh) stays as tall
// as before — hence the page-inside-a-page scrolling. Measuring the on-screen
// viewport lets a panel size and place itself against what the user can see.
function readMetrics() {
    const visual = window.visualViewport;
    metrics.height = Math.round(visual?.height ?? window.innerHeight);
    metrics.keyboardInset = visual
        ? Math.max(0, Math.round(window.innerHeight - visual.height - visual.offsetTop))
        : 0;
}
