// Start, end, stepping and counting for each calendar granularity.
import {
    addDays,
    addMonths,
    addQuarters,
    addYears,
    differenceInCalendarDays,
    differenceInCalendarMonths,
    differenceInCalendarQuarters,
    differenceInCalendarYears,
    endOfDay,
    endOfMonth,
    endOfQuarter,
    endOfYear,
    startOfDay,
    startOfMonth,
    startOfQuarter,
    startOfYear
} from "date-fns";

import type { Granularity } from "./types";

export type PeriodUnit = Exclude<Granularity, "time">;

export function unitOf(granularity: Granularity): PeriodUnit {
    return granularity === "time" ? "day" : granularity;
}

export function startOfPeriod(date: Date, unit: PeriodUnit): Date {
    switch (unit) {
        case "day":
            return startOfDay(date);
        case "month":
            return startOfMonth(date);
        case "quarter":
            return startOfQuarter(date);
        case "year":
            return startOfYear(date);
    }
}

export function endOfPeriod(date: Date, unit: PeriodUnit): Date {
    switch (unit) {
        case "day":
            return endOfDay(date);
        case "month":
            return endOfMonth(date);
        case "quarter":
            return endOfQuarter(date);
        case "year":
            return endOfYear(date);
    }
}

export function addPeriods(date: Date, amount: number, unit: PeriodUnit): Date {
    switch (unit) {
        case "day":
            return addDays(date, amount);
        case "month":
            return addMonths(date, amount);
        case "quarter":
            return addQuarters(date, amount);
        case "year":
            return addYears(date, amount);
    }
}

/** Calendar periods from a to b (b - a): 0 when both fall in the same period. */
export function periodDifference(b: Date, a: Date, unit: PeriodUnit): number {
    switch (unit) {
        case "day":
            return differenceInCalendarDays(b, a);
        case "month":
            return differenceInCalendarMonths(b, a);
        case "quarter":
            return differenceInCalendarQuarters(b, a);
        case "year":
            return differenceInCalendarYears(b, a);
    }
}

export function samePeriod(a: Date | undefined, b: Date | undefined, unit: PeriodUnit): boolean {
    return !!a && !!b && periodDifference(a, b, unit) === 0;
}

/** Local calendar day as "yyyy-mm-dd", for lookups. */
export function dayKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
    )}-${String(date.getDate()).padStart(2, "0")}`;
}
