// What the picker is doing: open or closed, the draft being picked, the month on screen. All picking rules live
// here, so the panel and triggers only render.
import { addMonths, startOfMonth } from "date-fns";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { checkRange, minutesOfDay, type RangeProblem } from "../core/constraints";
import { unitOf } from "../core/periods";
import type { Preset } from "../core/presets";
import type { RelativeResult } from "../core/relative";
import type { Edge, PickerValue } from "../core/types";
import { sameValue, setEdge, shapeValue, withDay, withTime } from "../core/value";
import { fillCount } from "./hooks";
import type { PickerConfig } from "./types";

export type PanelView = "calendar" | "months" | "years" | "help";

export interface PickerState {
    open: boolean;
    draft: PickerValue;
    /** The user changed the draft, so it stops following the saved value. */
    dirty: boolean;
    pending: boolean;
    hover?: Date;
    month: Date;
    view: PanelView;
    timeEdge: Edge;
    message?: string;
}

export interface PickerActions {
    openPopup: (view?: PanelView) => void;
    close: () => void;
    apply: () => void;
    pickDay: (day: Date) => void;
    pickTime: (minutes: number) => void;
    pickPreset: (preset: Preset) => void;
    setDraftEdge: (edge: Edge, date: Date | undefined) => void;
    applyTyped: (result: RelativeResult, edge: Edge) => void;
    setHover: (date: Date | undefined) => void;
    setMonth: (month: Date) => void;
    setView: (view: PanelView) => void;
    setTimeEdge: (edge: Edge) => void;
    setMessage: (message: string | undefined) => void;
    goToToday: () => void;
    /** Typing in the trigger's own fields, which saves right away. */
    commitEdge: (edge: Edge, date: Date | undefined) => string | undefined;
    commitTyped: (result: RelativeResult, edge: Edge) => string | undefined;
}

export interface PickerStateOptions {
    config: PickerConfig;
    value: PickerValue;
    onCommit: (value: PickerValue) => void;
    onOpenChange?: (open: boolean) => void;
    /** True while something outside asks the popup to close. */
    closeRequested?: boolean;
    onCloseHandled?: () => void;
    /** Inline calendars are always "open". */
    inline: boolean;
    numberOfMonths: number;
}

export function usePickerState(options: PickerStateOptions): [PickerState, PickerActions] {
    const { config, value, onCommit, inline, numberOfMonths } = options;
    const { selection, granularity, hasTime, applyMode, closeOnSelect, rangeEndAt, texts } = config;
    const unit = unitOf(granularity);
    const shape = { selection, granularity, hasTime, rangeEndAt };

    const initialMonth = (anchor: PickerValue): Date => {
        const date = anchor.start ?? anchor.end ?? config.openToDate ?? new Date();
        const first = startOfMonth(date);
        return config.showPreviousMonths ? addMonths(first, -(numberOfMonths - 1)) : first;
    };

    const [state, setState] = useState<PickerState>(() => ({
        open: inline,
        draft: value,
        dirty: false,
        pending: false,
        month: initialMonth(value),
        view: "calendar",
        timeEdge: "start"
    }));
    // Handlers read the latest state here, so two updates in one event don't see a stale copy.
    const stateRef = useRef(state);

    const patch = useCallback((changes: Partial<PickerState>) => {
        stateRef.current = { ...stateRef.current, ...changes };
        setState(stateRef.current);
    }, []);

    // The draft follows the saved value until the user starts picking.
    const startTime = value.start?.getTime();
    const endTime = value.end?.getTime();
    const [followed, setFollowed] = useState({ startTime, endTime });
    if (followed.startTime !== startTime || followed.endTime !== endTime) {
        setFollowed({ startTime, endTime });
        if (!state.dirty) {
            setState(current => ({
                ...current,
                draft: value,
                pending: false
            }));
        }
    }
    useLayoutEffect(() => {
        stateRef.current = state;
    });

    const problemMessage = (problem: RangeProblem | undefined): string | undefined => {
        switch (problem) {
            case "tooShort":
                return fillCount(texts.rangeTooShort, config.rangeRules.minLength);
            case "tooLong":
                return fillCount(texts.rangeTooLong, config.rangeRules.maxLength);
            case "crossesDisabled":
                return texts.rangeCrossesDisabled;
            default:
                return undefined;
        }
    };

    const rangeProblem = (next: PickerValue): string | undefined =>
        selection === "range" && next.start && next.end
            ? problemMessage(checkRange(next.start, next.end, unit, config.rangeRules, config.isDayDisabled))
            : undefined;

    const commit = (next: PickerValue): void => {
        const shaped = shapeValue(next, shape);
        if (!sameValue(shaped, shapeValue(value, shape))) {
            onCommit(shaped);
        }
    };

    const setOpen = (open: boolean, changes: Partial<PickerState> = {}): void => {
        if (inline) {
            patch({ ...changes, open: true });
            return;
        }
        const wasOpen = stateRef.current.open;
        patch({ ...changes, open });
        if (wasOpen !== open) {
            options.onOpenChange?.(open);
        }
    };

    const reset = (): Partial<PickerState> => {
        return {
            draft: value,
            dirty: false,
            pending: false,
            hover: undefined,
            message: undefined,
            timeEdge: "start"
        };
    };

    const close = (): void => {
        if (inline) {
            patch({ ...reset(), view: "calendar" });
            return;
        }
        setOpen(false, { ...reset(), view: "calendar" });
    };

    // Something outside (the close attribute) asked to close.
    const { closeRequested, onCloseHandled } = options;
    useEffect(() => {
        if (closeRequested) {
            if (stateRef.current.open && !inline) {
                setOpen(false, { ...reset(), view: "calendar" });
            }
            onCloseHandled?.();
        }
    }, [closeRequested]); // eslint-disable-line react-hooks/exhaustive-deps

    /** Saves right away when there is no Apply button, closing if asked to. */
    const settle = (next: PickerValue, changes: Partial<PickerState> = {}, closeNow = closeOnSelect): void => {
        if (applyMode) {
            patch({ draft: next, dirty: true, ...changes });
            return;
        }
        commit(next);
        if (closeNow && !inline) {
            setOpen(false, {
                draft: next,
                dirty: false,
                ...changes,
                pending: false,
                view: "calendar",
                message: undefined
            });
        } else {
            patch({ draft: next, dirty: false, ...changes });
        }
    };

    const actions: PickerActions = {
        openPopup: (view = "calendar") => {
            setOpen(true, { ...reset(), month: initialMonth(value), view });
        },
        close,
        apply: () => {
            const { draft, pending } = stateRef.current;
            const next = pending && draft.start ? { start: draft.start, end: draft.start } : draft;
            const problem = rangeProblem(next);
            if (problem) {
                patch({ message: problem });
                return;
            }
            commit(next);
            if (inline) {
                patch({
                    draft: shapeValue(next, shape),
                    dirty: false,
                    pending: false,
                    message: undefined
                });
            } else {
                setOpen(false, {
                    draft: next,
                    dirty: false,
                    pending: false,
                    message: undefined,
                    view: "calendar"
                });
            }
        },
        pickDay: day => {
            const { draft, pending } = stateRef.current;
            if (selection === "single") {
                const next = {
                    start: withDay(day, draft.start, hasTime, "start", rangeEndAt)
                };
                settle(next, { message: undefined }, closeOnSelect && !hasTime);
                return;
            }
            if (!pending || !draft.start) {
                patch({
                    dirty: true,
                    draft: {
                        start: withDay(day, draft.start, hasTime, "start", rangeEndAt),
                        end: undefined
                    },
                    pending: true,
                    message: undefined,
                    timeEdge: "end"
                });
                return;
            }
            const picked = withDay(day, draft.end, hasTime, "end", rangeEndAt);
            const next =
                picked < draft.start
                    ? {
                          start: withDay(day, draft.start, hasTime, "start", rangeEndAt),
                          end: withDay(draft.start, draft.end, hasTime, "end", rangeEndAt)
                      }
                    : { start: draft.start, end: picked };
            const problem = rangeProblem(next);
            if (problem) {
                patch({ message: problem });
                return;
            }
            settle(next, { pending: false, hover: undefined, message: undefined }, closeOnSelect && !hasTime);
        },
        pickTime: minutes => {
            const { draft, timeEdge } = stateRef.current;
            const edge: Edge = selection === "single" ? "start" : timeEdge;
            const base = draft[edge] ?? (edge === "end" ? draft.start : draft.end);
            const date = withTime(base, minutes);
            const next = setEdge(draft, edge, date);
            if (selection === "single" || (next.start && next.end)) {
                const problem = rangeProblem(next);
                if (problem) {
                    patch({ message: problem });
                    return;
                }
                settle(
                    next,
                    {
                        pending: false,
                        message: undefined,
                        timeEdge: edge === "start" ? "end" : edge
                    },
                    closeOnSelect && (selection === "single" || edge === "end")
                );
            } else {
                patch({
                    draft: next,
                    dirty: true,
                    timeEdge: "end",
                    message: undefined
                });
            }
        },
        pickPreset: preset => {
            const next = selection === "single" ? { start: preset.value.start } : preset.value;
            const anchor = next.start ?? next.end;
            const problem = rangeProblem(next);
            if (problem) {
                patch({ message: problem });
                return;
            }
            settle(next, {
                pending: false,
                hover: undefined,
                message: undefined,
                view: "calendar",
                ...(anchor ? { month: initialMonth(next) } : {})
            });
        },
        setDraftEdge: (edge, date) => {
            const next = setEdge(stateRef.current.draft, edge, date);
            const problem = rangeProblem(next);
            const changes: Partial<PickerState> = {
                pending: false,
                message: problem,
                ...(date ? { month: initialMonth(next) } : {})
            };
            if (problem || (selection === "range" && (!next.start || !next.end) && (next.start || next.end))) {
                patch({ draft: next, dirty: true, ...changes });
                return;
            }
            settle(next, changes, false);
        },
        applyTyped: (result, edge) => {
            if (result.kind === "range" && selection === "range") {
                const next = { start: result.start, end: result.end };
                const problem = rangeProblem(next);
                if (problem) {
                    patch({ message: problem });
                    return;
                }
                settle(
                    next,
                    {
                        pending: false,
                        message: undefined,
                        month: initialMonth(next)
                    },
                    false
                );
                return;
            }
            actions.setDraftEdge(edge, result.kind === "date" ? result.date : result.start);
        },
        setHover: hover => {
            if (stateRef.current.hover?.getTime() !== hover?.getTime()) {
                patch({ hover });
            }
        },
        setMonth: month => patch({ month }),
        setView: view => patch({ view }),
        setTimeEdge: timeEdge => patch({ timeEdge }),
        setMessage: message => patch({ message }),
        goToToday: () => {
            const today = new Date();
            if (selection === "single") {
                const date = hasTime
                    ? withTime(today, minutesOfDay(today))
                    : withDay(today, undefined, false, "start", rangeEndAt);
                settle(
                    { start: date },
                    {
                        month: initialMonth({ start: today }),
                        message: undefined
                    },
                    closeOnSelect && !hasTime
                );
            } else {
                patch({
                    month: initialMonth({ start: today }),
                    view: "calendar"
                });
            }
        },
        commitEdge: (edge, date) => {
            const next = selection === "single" ? { start: date } : setEdge(value, edge, date);
            const problem = rangeProblem(next);
            if (!problem) {
                commit(next);
            }
            return problem;
        },
        commitTyped: (result, edge) => {
            if (result.kind === "range" && selection === "range") {
                const next = { start: result.start, end: result.end };
                const problem = rangeProblem(next);
                if (!problem) {
                    commit(next);
                }
                return problem;
            }
            return actions.commitEdge(edge, result.kind === "date" ? result.date : result.start);
        }
    };

    return [state, actions];
}
