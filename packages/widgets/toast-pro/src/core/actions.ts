// Mendix actions return nothing from execute(); a running action shows up later as a new prop with
// isExecuting set. To wait for one, the widget notifies a RenderSignal after every render and the waiter
// checks the latest prop each time.

export interface ActionLike {
    readonly canExecute: boolean;
    readonly isExecuting: boolean;
    execute(): void;
}

export class RenderSignal {
    private readonly listeners = new Set<() => void>();

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    notify(): void {
        for (const listener of [...this.listeners]) {
            listener();
        }
    }
}

export function executeAction(action: ActionLike | undefined): boolean {
    if (action?.canExecute && !action.isExecuting) {
        action.execute();
        return true;
    }
    return false;
}

export interface WaitOptions {
    /** How long to wait for the action to report that it started; a quick nanoflow may never show as running. */
    startGrace?: number;
    /** Gives up after this long so a hanging microflow can't keep a toast stuck. */
    limit?: number;
}

/** Runs the action and resolves once it has finished, or right away when there is nothing to run. */
export function runAndWait(
    read: () => ActionLike | undefined,
    signal: RenderSignal,
    { startGrace = 300, limit = 10000 }: WaitOptions = {}
): Promise<void> {
    if (!executeAction(read())) {
        return Promise.resolve();
    }
    return new Promise(resolve => {
        let started = false;
        const finish = (): void => {
            unsubscribe();
            clearTimeout(graceTimer);
            clearTimeout(limitTimer);
            resolve();
        };
        const check = (): void => {
            if (read()?.isExecuting) {
                started = true;
            } else if (started) {
                finish();
            }
        };
        const unsubscribe = signal.subscribe(check);
        const graceTimer = setTimeout(() => {
            if (!started) {
                finish();
            }
        }, startGrace);
        const limitTimer = setTimeout(finish, limit);
        check();
    });
}
