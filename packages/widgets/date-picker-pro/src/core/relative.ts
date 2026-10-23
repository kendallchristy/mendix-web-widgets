// Relative typing: "t", "+7d", "next fri", "last month", "ytd" and friends. The help popover lists the same
// shortcuts (see shortcuts.ts), so keep the two in step.
import {
    addDays,
    addMonths,
    addQuarters,
    addWeeks,
    addYears,
    endOfWeek,
    setDate,
    startOfDay,
    startOfWeek
} from "date-fns";

import type { LocaleInfo, WeekDay } from "./locale";
import { endOfPeriod, startOfPeriod } from "./periods";

export type RelativeResult = { kind: "date"; date: Date } | { kind: "range"; start: Date; end: Date };

export interface RelativeContext {
    /** Now, including the time of day. */
    now: Date;
    weekStartsOn: WeekDay;
    locale: LocaleInfo;
}

type Unit = "day" | "week" | "month" | "quarter" | "year";

const unitWords: Array<[RegExp, Unit]> = [
    [/^(d|day|days)$/, "day"],
    [/^(w|wk|wks|week|weeks)$/, "week"],
    [/^(m|mo|mos|month|months)$/, "month"],
    [/^(q|qtr|quarter|quarters)$/, "quarter"],
    [/^(y|yr|yrs|year|years)$/, "year"]
];

function parseUnit(word: string | undefined): Unit | undefined {
    if (!word) {
        return "day";
    }
    return unitWords.find(([pattern]) => pattern.test(word))?.[1];
}

function add(date: Date, amount: number, unit: Unit): Date {
    switch (unit) {
        case "day":
            return addDays(date, amount);
        case "week":
            return addWeeks(date, amount);
        case "month":
            return addMonths(date, amount);
        case "quarter":
            return addQuarters(date, amount);
        case "year":
            return addYears(date, amount);
    }
}

const englishWeekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function parseWeekday(word: string, locale: LocaleInfo): number | undefined {
    if (word.length < 2) {
        return undefined;
    }
    const lists = [englishWeekdays, locale.weekdaysLong.map(n => n.toLowerCase())];
    for (const list of lists) {
        const index = list.findIndex(name => name.startsWith(word.replace(/\.$/, "")));
        if (index >= 0) {
            return index;
        }
    }
    return undefined;
}

function periodRange(today: Date, unit: Unit, offset: number, weekStartsOn: WeekDay): RelativeResult {
    if (unit === "week") {
        const date = addWeeks(today, offset);
        return {
            kind: "range",
            start: startOfWeek(date, { weekStartsOn }),
            end: startOfDay(endOfWeek(date, { weekStartsOn }))
        };
    }
    if (unit === "day") {
        const date = addDays(today, offset);
        return { kind: "range", start: date, end: date };
    }
    const date = add(today, offset, unit);
    return {
        kind: "range",
        start: startOfPeriod(date, unit),
        end: startOfDay(endOfPeriod(date, unit))
    };
}

/**
 * Reads a relative expression. Returns undefined when the text isn't one, so the caller can try reading it as
 * a normal date instead.
 */
export function parseRelative(text: string, context: RelativeContext): RelativeResult | undefined {
    const input = text.trim().toLowerCase().replace(/\s+/g, " ");
    if (!input) {
        return undefined;
    }
    const { now, weekStartsOn, locale } = context;
    const today = startOfDay(now);
    const date = (value: Date): RelativeResult => ({
        kind: "date",
        date: value
    });

    switch (input) {
        case "now":
            return date(now);
        case "t":
        case "today":
            return date(today);
        case "y":
        case "yesterday":
            return date(addDays(today, -1));
        case "tom":
        case "tmr":
        case "tomorrow":
            return date(addDays(today, 1));
        case "wtd":
            return {
                kind: "range",
                start: startOfWeek(today, { weekStartsOn }),
                end: today
            };
        case "mtd":
            return {
                kind: "range",
                start: startOfPeriod(today, "month"),
                end: today
            };
        case "qtd":
            return {
                kind: "range",
                start: startOfPeriod(today, "quarter"),
                end: today
            };
        case "ytd":
            return {
                kind: "range",
                start: startOfPeriod(today, "year"),
                end: today
            };
    }

    // +7, -2w, + 3 months
    let match = /^([+-]) ?(\d{1,4}) ?([a-z]*)$/.exec(input);
    if (match) {
        const unit = parseUnit(match[3] || undefined);
        if (!unit) {
            return undefined;
        }
        const amount = Number(match[2]) * (match[1] === "-" ? -1 : 1);
        return date(add(today, amount, unit));
    }

    // "15": the 15th of this month
    match = /^(\d{1,2})$/.exec(input);
    if (match) {
        const day = Number(match[1]);
        const candidate = setDate(today, day);
        return day >= 1 && candidate.getMonth() === today.getMonth() ? date(candidate) : undefined;
    }

    // this/last/next week|month|quarter|year
    match = /^(this|last|prev|previous|next) (day|week|month|quarter|year)$/.exec(input);
    if (match) {
        const offset = match[1] === "this" ? 0 : match[1] === "next" ? 1 : -1;
        return periodRange(today, parseUnit(match[2])!, offset, weekStartsOn);
    }

    // last 7 days, past 3 months, next 14 days
    match = /^(last|past|prev|previous|next) (\d{1,4}) ?([a-z]+)$/.exec(input);
    if (match) {
        const unit = parseUnit(match[3]);
        const count = Number(match[2]);
        if (!unit || count < 1) {
            return undefined;
        }
        // Counted with today included: "last 7 days" is today and the 6 days before it.
        return match[1] === "next"
            ? {
                  kind: "range",
                  start: today,
                  end: addDays(add(today, count, unit), -1)
              }
            : {
                  kind: "range",
                  start: addDays(add(today, -count, unit), 1),
                  end: today
              };
    }

    // fri, next fri, last monday
    match = /^(?:(next|last|prev|previous) )?([\p{L}.]+)$/u.exec(input);
    if (match) {
        const weekday = parseWeekday(match[2], locale);
        if (weekday === undefined) {
            return undefined;
        }
        const diff = (weekday - today.getDay() + 7) % 7;
        if (!match[1]) {
            return date(addDays(today, diff));
        }
        if (match[1] === "next") {
            return date(addDays(today, diff === 0 ? 7 : diff));
        }
        const back = (today.getDay() - weekday + 7) % 7;
        return date(addDays(today, -(back === 0 ? 7 : back)));
    }
    return undefined;
}

/** Whether a typed character could begin a relative expression in a numeric segment. */
export function startsRelative(char: string): boolean {
    return /^[+\-\p{L}]$/u.test(char);
}
