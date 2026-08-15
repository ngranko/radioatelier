import {markerLifecycle} from '$lib/services/map/markerLifecycle';

export class UpdateScheduler {
    private updateInProgress = false;
    private shouldUpdate = false;
    private pendingViewportUpdate = false;
    private suppressUpdates = false;

    public constructor(private triggerFn: () => void) {
        //
    }

    public schedule() {
        if (this.pendingViewportUpdate || this.suppressUpdates) {
            return;
        }
        this.pendingViewportUpdate = true;
        markerLifecycle.begin();
        setTimeout(() => {
            this.pendingViewportUpdate = false;
            this.trigger();
        }, 0);
    }

    private trigger() {
        if (this.suppressUpdates) {
            markerLifecycle.end();
            return;
        }
        if (this.updateInProgress) {
            this.shouldUpdate = true;
            markerLifecycle.end();
            return;
        }

        this.updateInProgress = true;
        try {
            this.shouldUpdate = false;
            this.triggerFn();
        } catch (e) {
            console.error('error updating viewport');
            console.error(e);
            this.abortInFlight();
        }
    }

    public complete() {
        this.updateInProgress = false;
        markerLifecycle.end();
        if (this.shouldUpdate && !this.suppressUpdates) {
            this.schedule();
        }
    }

    public disable() {
        this.suppressUpdates = true;
    }

    public enable() {
        this.suppressUpdates = false;
        if (this.shouldUpdate && !this.updateInProgress) {
            this.schedule();
        }
    }

    public get isSuppressed() {
        return this.suppressUpdates;
    }

    private abortInFlight() {
        if (!this.updateInProgress) {
            return;
        }
        this.updateInProgress = false;
        markerLifecycle.end();
    }
}
