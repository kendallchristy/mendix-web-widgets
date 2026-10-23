// Which days, periods, times and ranges the user may pick.
import { addDays, startOfDay } from "date-fns";

import { addPeriods, dayKey, endOfPeriod, periodDifference, startOfPeriod, type PeriodUnit } from "./periods";

export type ListMode = "off" | "include" | "exclude";

export interface DateConstraints {
    /** Earliest selectable day (inclusive). */
    min?: Date;
    /** Latest selectable day (inclusive). */
    max?: Date;
    specificDays?: { mode: ListMode; days: Date[] };
    intervals?: { mode: ListMode; ranges: Array<{ start: Date; end: Date }> };
    /** Index 0 = Sunday. */
    disabledWeekdays?: boolean[];
}

export type DayTest = (date: Date) => boolean;

/** Compiles the constraints into a fast per-day test. Returns true when the day can't be picked. */
export function createDayTest(constraints: DateConstraints): DayTest {
    const min = constraints.min ? startOfDay(constraints.min) : undefined;
    const max = constraints.max ? startOfDay(constraints.max) : undefined;
    const specificMode = constraints.specificDays?.mode ?? "off";
    const specific = new Set((constraints.specificDays?.days ?? []).map(dayKey));
    const intervalMode = constraints.intervals?.mode ?? "off";
    const intervals = (constraints.intervals?.ranges ?? [])
        .filter(range => range.start && range.end)
        .map(range => {
            const a = startOfDay(range.start).getTime();
            const b = startOfDay(range.end).getTime();
            return a <= b ? [a, b] : [b, a];
        });
    const weekdays = constraints.disabledWeekdays ?? [];

    return (date: Date): boolean => {
        const day = startOfDay(date);
        if ((min && day < min) || (max && day > max)) {
            return true;
        }
        if (weekdays[day.getDay()]) {
            return true;
        }
        if (specificMode !== "off") {
            const listed = specific.has(dayKey(day));
            if (specificMode === "include" ? !listed : listed) {
                return true;
            }
        }
        if (intervalMode !== "off") {
            const time = day.getTime();
            const inside = intervals.some(([a, b]) => time >= a && time <= b);
            if (intervalMode === "include" ? !inside : inside) {
                return true;
            }
        }
        return false;
    };
}

/** A month, quarter or year can be picked when at least one of its days can. */
export function isPeriodDisabled(date: Date, unit: PeriodUnit, isDayDisabled: DayTest): boolean {
    if (unit === "day") {
        return isDayDisabled(date);
    }
    const last = endOfPeriod(date, unit);
    for (let day = startOfPeriod(date, unit); day <= last; day = addDays(day, 1)) {
        if (!isDayDisabled(day)) {
            return false;
        }
    }
    return true;
}

export interface TimeConstraints {
    /** Minutes after midnight. */
    min?: number;
    max?: number;
    specificTimes?: { mode: ListMode; times: number[] };
}

export const minutesOfDay = (date: Date): number => date.getHours() * 60 + date.getMinutes();

export function isTimeAllowed(minutes: number, constraints: TimeConstraints): boolean {
    if (constraints.min !== undefined && minutes < constraints.min) {
        return false;
    }
    if (constraints.max !== undefined && minutes > constraints.max) {
        return false;
    }
    const mode = constraints.specificTimes?.mode ?? "off";
    if (mode !== "off") {
        const listed = constraints.specificTimes!.times.includes(minutes);
        return mode === "include" ? listed : !listed;
    }
    return true;
}

/** The time options of the time list: every `interval` minutes from midnight, minus the ones not allowed. */
export function timeOptions(interval: number, constraints: TimeConstraints): number[] {
    const step = interval > 0 ? Math.min(Math.round(interval), 720) : 15;
    const options: number[] = [];
    for (let minutes = 0; minutes < 24 * 60; minutes += step) {
        if (isTimeAllowed(minutes, constraints)) {
            options.push(minutes);
        }
    }
    // Included specific times show even when they fall between the interval's steps.
    if (constraints.specificTimes?.mode === "include") {
        for (const minutes of constraints.specificTimes.times) {
            if (!options.includes(minutes) && isTimeAllowed(minutes, constraints)) {
                options.push(minutes);
            }
        }
        options.sort((a, b) => a - b);
    }
    return options;
}

export interface RangeRules {
    /** Shortest range in periods, counting both ends (a single day is 1). */
    minLength?: number;
    /** Longest range in periods, counting both ends. */
    maxLength?: number;
    /** Refuse ranges with a disabled day inside. */
    excludeDisabled?: boolean;
}

export type RangeProblem = "tooShort" | "tooLong" | "crossesDisabled";

export function rangeLength(start: Date, end: Date, unit: PeriodUnit): number {
    return Math.abs(periodDifference(end, start, unit)) + 1;
}

export function checkRange(
    start: Date,
    end: Date,
    unit: PeriodUnit,
    rules: RangeRules,
    isDayDisabled: DayTest
): RangeProblem | undefined {
    const length = rangeLength(start, end, unit);
    if (rules.minLength && length < rules.minLength) {
        return "tooShort";
    }
    if (rules.maxLength && length > rules.maxLength) {
        return "tooLong";
    }
    if (rules.excludeDisabled) {
        const [from, to] = start <= end ? [start, end] : [end, start];
        for (let period = startOfPeriod(from, unit); period <= to; period = addPeriods(period, 1, unit)) {
            if (isPeriodDisabled(period, unit, isDayDisabled)) {
                return "crossesDisabled";
            }
        }
    }
    return undefined;
}

/**
 * While the start of a range is picked and the end isn't, these periods can't be the end: too close, too far, or
 * past a disabled period.
 */
export function createPendingEndTest(
    start: Date,
    unit: PeriodUnit,
    rules: RangeRules,
    isDayDisabled: DayTest
): (date: Date) => boolean {
    let lowerBlock: Date | undefined;
    let upperBlock: Date | undefined;
    if (rules.excludeDisabled) {
        // Find the nearest disabled period on each side; nothing beyond it can be reached.
        const limit = rules.maxLength ?? 3660;
        for (let i = 1; i <= limit; i++) {
            const after = addPeriods(start, i, unit);
            if (!upperBlock && isPeriodDisabled(after, unit, isDayDisabled)) {
                upperBlock = startOfPeriod(after, unit);
            }
            const before = addPeriods(start, -i, unit);
            if (!lowerBlock && isPeriodDisabled(before, unit, isDayDisabled)) {
                lowerBlock = startOfPeriod(before, unit);
            }
            if (upperBlock && lowerBlock) {
                break;
            }
        }
    }
    return (date: Date): boolean => {
        const length = rangeLength(start, date, unit);
        if ((rules.minLength && length < rules.minLength) || (rules.maxLength && length > rules.maxLength)) {
            return true;
        }
        const period = startOfPeriod(date, unit);
        return !!((upperBlock && period >= upperBlock) || (lowerBlock && period <= lowerBlock));
    };
}
