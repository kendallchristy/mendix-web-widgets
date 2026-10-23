// Shaping picked values before they're saved.
import { endOfDay, startOfDay } from "date-fns";

import { endOfPeriod, startOfPeriod, unitOf } from "./periods";
import type { Edge, Granularity, PickerValue, SelectionType } from "./types";

export type RangeEndAt = "start" | "end";

export interface ValueShape {
    selection: SelectionType;
    granularity: Granularity;
    hasTime: boolean;
    /** Save a range's end as the start of its last period (00:00) or the very end of it (23:59:59.999). */
    rangeEndAt: RangeEndAt;
}

/**
 * Snaps dates to their period and sets the end of a range, so "January 2026" is saved as 1 January 00:00 and the
 * end of a day range lands on 00:00 or 23:59:59.999 of its last day.
 */
export function shapeValue(value: PickerValue, shape: ValueShape): PickerValue {
    if (shape.granularity === "time" || shape.hasTime) {
        return shape.selection === "single" ? { start: value.start } : { start: value.start, end: value.end };
    }
    const unit = unitOf(shape.granularity);
    const start = value.start ? startOfPeriod(value.start, unit) : undefined;
    if (shape.selection === "single") {
        return { start };
    }
    const end = value.end
        ? shape.rangeEndAt === "end"
            ? endOfPeriod(value.end, unit)
            : startOfPeriod(value.end, unit)
        : undefined;
    return { start, end };
}

/** Puts a newly picked day on an edge, keeping that edge's time of day when the picker shows times. */
export function withDay(
    day: Date,
    previous: Date | undefined,
    hasTime: boolean,
    edge: Edge,
    rangeEndAt: RangeEndAt
): Date {
    if (!hasTime) {
        return startOfDay(day);
    }
    const result = startOfDay(day);
    if (previous) {
        result.setHours(previous.getHours(), previous.getMinutes(), previous.getSeconds(), previous.getMilliseconds());
    } else if (edge === "end" && rangeEndAt === "end") {
        return endOfDay(day);
    }
    return result;
}

/** Sets the time of day (minutes after midnight) on a date, or on today when there is no date yet. */
export function withTime(date: Date | undefined, minutes: number, today = new Date()): Date {
    const result = startOfDay(date ?? today);
    result.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    return result;
}

export function sameValue(a: PickerValue, b: PickerValue): boolean {
    const same = (x?: Date, y?: Date): boolean => (x?.getTime() ?? null) === (y?.getTime() ?? null);
    return same(a.start, b.start) && same(a.end, b.end);
}

/** Keeps a range in order after one edge was typed: an edge that crosses the other clears it. */
export function setEdge(value: PickerValue, edge: Edge, date: Date | undefined): PickerValue {
    if (edge === "start") {
        return {
            start: date,
            end: date && value.end && value.end < date ? undefined : value.end
        };
    }
    return {
        start: date && value.start && value.start > date ? undefined : value.start,
        end: date
    };
}
