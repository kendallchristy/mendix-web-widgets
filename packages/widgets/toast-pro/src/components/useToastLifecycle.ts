import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { executeAction, runAndWait, type ActionLike, type RenderSignal } from "../core/actions";
import type { CloseReason, Phase } from "../core/types";

export interface LifecycleActions {
    onBeforeShow?: ActionLike;
    onShow?: ActionLike;
    onTimeout?: ActionLike;
    onDismiss?: ActionLike;
    onBeforeClose?: ActionLike;
    onClose?: ActionLike;
}

export interface LifecycleOptions {
    /** The latest actions; read again after every wait because Mendix hands over new objects on each render. */
    actions(): LifecycleActions;
    signal: RenderSignal;
    writeReason(reason: CloseReason): void;
    /** Runs once the toast is gone, before On close: resets the show attribute. */
    afterClose(): void;
    exitDuration: number;
}

export interface Lifecycle {
    phase: Phase;
    /** Goes up each time the toast is shown or re-triggered while open, which restarts its countdown. */
    generation: number;
    show(): void;
    close(reason: CloseReason): void;
}

const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export function useToastLifecycle(options: LifecycleOptions): Lifecycle {
    const [state, setState] = useState<{ phase: Phase; generation: number }>({ phase: "hidden", generation: 0 });
    const phase = useRef<Phase>("hidden");
    const latest = useRef(options);
    useLayoutEffect(() => {
        latest.current = options;
    });
    // Each step that waits checks this afterwards; a newer step or unmounting makes it stale.
    const run = useRef(0);
    const showAfterExit = useRef(false);

    useEffect(() => {
        const runs = run;
        return () => {
            runs.current++;
        };
    }, []);

    const setPhase = useCallback((next: Phase, restart = false) => {
        phase.current = next;
        setState(s => ({ phase: next, generation: restart ? s.generation + 1 : s.generation }));
    }, []);

    const show = useCallback(async (): Promise<void> => {
        if (phase.current === "open") {
            setPhase("open", true);
            return;
        }
        if (phase.current === "closing" || phase.current === "exiting") {
            showAfterExit.current = true;
            return;
        }
        if (phase.current === "opening") {
            return;
        }
        const id = ++run.current;
        setPhase("opening");
        await runAndWait(() => latest.current.actions().onBeforeShow, latest.current.signal);
        if (run.current !== id) {
            return;
        }
        setPhase("open", true);
        executeAction(latest.current.actions().onShow);
    }, [setPhase]);

    const close = useCallback(
        async (reason: CloseReason): Promise<void> => {
            const options = latest.current;
            if (phase.current === "opening") {
                // Closed before it appeared (Close when turned true while On before show ran).
                run.current++;
                setPhase("hidden");
                options.afterClose();
                return;
            }
            if (phase.current !== "open") {
                return;
            }
            const id = ++run.current;
            options.writeReason(reason);
            if (reason === "Timeout") {
                executeAction(options.actions().onTimeout);
            } else if (reason === "Dismissed") {
                executeAction(options.actions().onDismiss);
            }
            if (reason !== "Replaced") {
                setPhase("closing");
                await runAndWait(() => latest.current.actions().onBeforeClose, options.signal);
                if (run.current !== id) {
                    return;
                }
            }
            setPhase("exiting");
            await wait(options.exitDuration);
            if (run.current !== id) {
                return;
            }
            setPhase("hidden");
            latest.current.afterClose();
            executeAction(latest.current.actions().onClose);
            if (showAfterExit.current) {
                showAfterExit.current = false;
                void show();
            }
        },
        [setPhase, show]
    );

    return {
        phase: state.phase,
        generation: state.generation,
        show: useCallback(() => void show(), [show]),
        close: useCallback((reason: CloseReason) => void close(reason), [close])
    };
}
