export class UpdateScheduler {
    private updateInProgress = false;
    private shouldUpdate = false;
    private pendingViewportUpdate = false;
    private suppressUpdates = false;
    private pendingTimer?: ReturnType<typeof setTimeout>;

    public constructor(private triggerFn: () => void) {
        //
    }

    public schedule() {
        if (this.pendingViewportUpdate || this.suppressUpdates) {
            return;
        }
        this.pendingViewportUpdate = true;
        this.pendingTimer = setTimeout(() => {
            this.pendingTimer = undefined;
            this.pendingViewportUpdate = false;
            this.trigger();
        }, 0);
    }

    public cancelPending() {
        if (this.pendingTimer !== undefined) {
            clearTimeout(this.pendingTimer);
            this.pendingTimer = undefined;
        }
        this.pendingViewportUpdate = false;
        this.shouldUpdate = false;
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
}
