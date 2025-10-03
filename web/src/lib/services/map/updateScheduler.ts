export class UpdateScheduler {
    private updateInProgress = false;
    private shouldUpdate = false;
    private pendingViewportUpdate = false;
    private suppressUpdates = false;

    public constructor(
        private triggerFn: () => void,
    ) {
        //
    }

    public schedule() {
        if (this.pendingViewportUpdate || this.suppressUpdates) {
            return;
        }
        this.pendingViewportUpdate = true;
        setTimeout(() => {
            this.pendingViewportUpdate = false;
            this.trigger();
        }, 0);
    }

    private trigger() {
        if (this.suppressUpdates) {
            return;
        }
        if (this.updateInProgress) {
            this.shouldUpdate = true;
            return;
        }

        this.updateInProgress = true;
        try {
            this.shouldUpdate = false;
            this.triggerFn();
        } catch (e) {
            console.error('error updating viewport');
            console.error(e);
            this.updateInProgress = false;
        }
    }

    public complete() {
        this.updateInProgress = false;
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

    public get isUpdating() {
        return this.updateInProgress;
    }
}
