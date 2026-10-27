// A countdown that can be paused for several reasons at once (hover, focus, hidden tab, queued) and resumes
// only when none is left. Time is read from `now` so tests can drive it with fake timers.

export type PauseReason = "hover" | "focus" | "hidden" | "queued";

export class Countdown {
    private readonly reasons = new Set<PauseReason>();
    private elapsedBefore = 0;
    private startedAt: number | undefined;
    private timer: ReturnType<typeof setTimeout> | undefined;
    private done = false;
    private readonly listeners = new Set<() => void>();
    private onElapsed: () => void = () => undefined;

    constructor(
        readonly duration: number,
        private readonly now: () => number = () => Date.now()
    ) {}

    start(onElapsed: () => void, paused: Iterable<PauseReason> = []): void {
        this.onElapsed = onElapsed;
        for (const reason of paused) {
            this.reasons.add(reason);
        }
        if (this.reasons.size === 0) {
            this.run();
        }
    }

    setPaused(reason: PauseReason, paused: boolean): void {
        if (this.done || paused === this.reasons.has(reason)) {
            return;
        }
        if (paused) {
            const wasRunning = this.reasons.size === 0;
            this.reasons.add(reason);
            if (wasRunning) {
                this.halt();
            }
        } else {
            this.reasons.delete(reason);
            if (this.reasons.size === 0) {
                this.run();
            }
        }
    }

    get running(): boolean {
        return this.startedAt !== undefined;
    }

    /** Called whenever the countdown starts or stops running. */
    subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };

    isRunning = (): boolean => this.running;

    elapsed(): number {
        const current = this.startedAt === undefined ? 0 : this.now() - this.startedAt;
        return Math.min(this.duration, this.elapsedBefore + current);
    }

    remaining(): number {
        return Math.max(0, this.duration - this.elapsed());
    }

    stop(): void {
        this.done = true;
        this.halt();
    }

    private run(): void {
        if (this.done || this.startedAt !== undefined) {
            return;
        }
        this.startedAt = this.now();
        this.timer = setTimeout(() => {
            this.halt();
            this.done = true;
            this.onElapsed();
        }, this.duration - this.elapsedBefore);
        this.emit();
    }

    private halt(): void {
        if (this.timer !== undefined) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
        if (this.startedAt !== undefined) {
            this.elapsedBefore += this.now() - this.startedAt;
            this.startedAt = undefined;
            this.emit();
        }
    }

    private emit(): void {
        for (const listener of [...this.listeners]) {
            listener();
        }
    }
}
