// Mendix date patterns (the symbols of formatDateTime, plus Q for quarters): tokenizing, formatting and
// parsing. The segmented input edits the same tokens, so typing and display always agree.
import { getDayOfYear, getDaysInMonth, getISODay, getWeek, getWeekOfMonth } from "date-fns";

import type { LocaleInfo } from "./locale";
import type { Granularity } from "./types";

export type SegmentType =
    "year" | "month" | "day" | "hour" | "minute" | "second" | "millisecond" | "dayPeriod" | "quarter";

export type Token =
    | { kind: "literal"; text: string }
    | { kind: "segment"; type: SegmentType; letter: string; length: number }
    | { kind: "display"; letter: string; length: number };

const segmentLetters: Record<string, SegmentType> = {
    y: "year",
    M: "month",
    L: "month",
    d: "day",
    H: "hour",
    k: "hour",
    K: "hour",
    h: "hour",
    m: "minute",
    s: "second",
    S: "millisecond",
    a: "dayPeriod",
    Q: "quarter"
};
const displayLetters = new Set(["E", "u", "w", "W", "D", "F", "G", "z", "Z", "X"]);

export function tokenize(pattern: string): Token[] {
    const tokens: Token[] = [];
    const pushLiteral = (text: string): void => {
        const last = tokens[tokens.length - 1];
        if (last?.kind === "literal") {
            last.text += text;
        } else if (text) {
            tokens.push({ kind: "literal", text });
        }
    };
    let i = 0;
    while (i < pattern.length) {
        const char = pattern[i];
        if (char === "'") {
            if (pattern[i + 1] === "'") {
                pushLiteral("'");
                i += 2;
                continue;
            }
            let end = i + 1;
            let text = "";
            while (end < pattern.length) {
                if (pattern[end] === "'" && pattern[end + 1] === "'") {
                    text += "'";
                    end += 2;
                } else if (pattern[end] === "'") {
                    break;
                } else {
                    text += pattern[end++];
                }
            }
            pushLiteral(text);
            i = end + 1;
            continue;
        }
        if (segmentLetters[char] || displayLetters.has(char)) {
            let length = 1;
            while (pattern[i + length] === char) {
                length++;
            }
            tokens.push(
                segmentLetters[char]
                    ? {
                          kind: "segment",
                          type: segmentLetters[char],
                          letter: char,
                          length
                      }
                    : { kind: "display", letter: char, length }
            );
            i += length;
            continue;
        }
        pushLiteral(char);
        i++;
    }
    return tokens;
}

type SegmentToken = Extract<Token, { kind: "segment" }>;

export function segmentTokens(tokens: Token[]): SegmentToken[] {
    return tokens.filter((token): token is SegmentToken => token.kind === "segment");
}

export function hasSegment(tokens: Token[], type: SegmentType): boolean {
    return tokens.some(token => token.kind === "segment" && token.type === type);
}

export function hasTime(tokens: Token[]): boolean {
    return ["hour", "minute", "second"].some(type => hasSegment(tokens, type as SegmentType));
}

/** Which calendar a pattern needs: "MMM yyyy" picks months, "yyyy QQQ" quarters, "HH:mm" only a time. */
export function granularityOf(tokens: Token[]): Granularity {
    if (hasSegment(tokens, "day") || tokens.some(token => token.kind === "display" && /[EuDF]/.test(token.letter))) {
        return "day";
    }
    if (hasSegment(tokens, "month")) {
        return "month";
    }
    if (hasSegment(tokens, "quarter")) {
        return "quarter";
    }
    if (hasSegment(tokens, "year")) {
        return "year";
    }
    return hasTime(tokens) ? "time" : "day";
}

export function is12Hour(tokens: Token[]): boolean {
    return tokens.some(token => token.kind === "segment" && (token.letter === "h" || token.letter === "K"));
}

const pad = (value: number, length: number): string => String(value).padStart(length, "0");

/** Formats one segment token for a date. */
export function formatSegment(token: SegmentToken, date: Date, locale: LocaleInfo): string {
    const { letter, length } = token;
    switch (token.type) {
        case "year": {
            const year = date.getFullYear();
            return length === 2 ? pad(year % 100, 2) : pad(year, length);
        }
        case "month": {
            const month = date.getMonth();
            if (length >= 4) {
                return locale.monthsLong[month];
            }
            return length === 3 ? locale.monthsShort[month] : pad(month + 1, length);
        }
        case "day":
            return pad(date.getDate(), length);
        case "hour": {
            const hours = date.getHours();
            const value =
                letter === "H" ? hours : letter === "k" ? hours || 24 : letter === "K" ? hours % 12 : hours % 12 || 12;
            return pad(value, length);
        }
        case "minute":
            return pad(date.getMinutes(), length);
        case "second":
            return pad(date.getSeconds(), length);
        case "millisecond":
            return pad(date.getMilliseconds(), Math.max(length, 3)).slice(0, Math.max(length, 3));
        case "dayPeriod":
            return locale.dayPeriods[date.getHours() < 12 ? 0 : 1];
        case "quarter": {
            const quarter = Math.floor(date.getMonth() / 3) + 1;
            return length >= 3 ? `Q${quarter}` : pad(quarter, length);
        }
    }
}

function formatDisplay(token: Extract<Token, { kind: "display" }>, date: Date, locale: LocaleInfo): string {
    const { letter, length } = token;
    switch (letter) {
        case "E":
            return (length >= 4 ? locale.weekdaysLong : locale.weekdaysShort)[date.getDay()];
        case "u":
            return String(getISODay(date));
        case "w":
            return pad(getWeek(date, { weekStartsOn: locale.firstDayOfWeek }), length);
        case "W":
            return String(getWeekOfMonth(date, { weekStartsOn: locale.firstDayOfWeek }));
        case "D":
            return pad(getDayOfYear(date), length);
        case "F":
            return String(Math.ceil(date.getDate() / 7));
        case "G":
            return date.getFullYear() > 0 ? "AD" : "BC";
        default: {
            const offset = -date.getTimezoneOffset();
            const sign = offset >= 0 ? "+" : "-";
            const hours = pad(Math.floor(Math.abs(offset) / 60), 2);
            const minutes = pad(Math.abs(offset) % 60, 2);
            return letter === "X" && length === 1 ? `${sign}${hours}` : `${sign}${hours}${minutes}`;
        }
    }
}

export function formatDate(date: Date, tokens: Token[], locale: LocaleInfo): string {
    return tokens
        .map(token =>
            token.kind === "literal"
                ? token.text
                : token.kind === "segment"
                  ? formatSegment(token, date, locale)
                  : formatDisplay(token, date, locale)
        )
        .join("");
}

/** Values typed into the segments. Hours keep the scale of their token (1-12 for "h"). */
export type DateParts = Partial<Record<SegmentType, number>>;

export function partsFromDate(date: Date | undefined, tokens: Token[]): DateParts {
    if (!date) {
        return {};
    }
    const parts: DateParts = {};
    for (const token of segmentTokens(tokens)) {
        parts[token.type] = segmentValue(token, date);
    }
    return parts;
}

export function segmentValue(token: SegmentToken, date: Date): number {
    switch (token.type) {
        case "year":
            return date.getFullYear();
        case "month":
            return date.getMonth() + 1;
        case "day":
            return date.getDate();
        case "hour": {
            const hours = date.getHours();
            return token.letter === "H"
                ? hours
                : token.letter === "k"
                  ? hours || 24
                  : token.letter === "K"
                    ? hours % 12
                    : hours % 12 || 12;
        }
        case "minute":
            return date.getMinutes();
        case "second":
            return date.getSeconds();
        case "millisecond":
            return date.getMilliseconds();
        case "dayPeriod":
            return date.getHours() < 12 ? 0 : 1;
        case "quarter":
            return Math.floor(date.getMonth() / 3) + 1;
    }
}

export interface SegmentBounds {
    min: number;
    max: number;
    /** How many digits can be typed. */
    digits: number;
}

export function segmentBounds(token: SegmentToken, parts: DateParts = {}): SegmentBounds {
    switch (token.type) {
        case "year":
            return token.length === 2 ? { min: 0, max: 99, digits: 2 } : { min: 1, max: 9999, digits: 4 };
        case "month":
            return { min: 1, max: 12, digits: 2 };
        case "day": {
            const days =
                parts.year !== undefined && parts.month !== undefined
                    ? getDaysInMonth(new Date(expandYear(parts.year, token.length), parts.month - 1, 1))
                    : 31;
            return { min: 1, max: days, digits: 2 };
        }
        case "hour":
            return token.letter === "H"
                ? { min: 0, max: 23, digits: 2 }
                : token.letter === "k"
                  ? { min: 1, max: 24, digits: 2 }
                  : token.letter === "K"
                    ? { min: 0, max: 11, digits: 2 }
                    : { min: 1, max: 12, digits: 2 };
        case "minute":
        case "second":
            return { min: 0, max: 59, digits: 2 };
        case "millisecond":
            return { min: 0, max: 999, digits: 3 };
        case "dayPeriod":
            return { min: 0, max: 1, digits: 1 };
        case "quarter":
            return { min: 1, max: 4, digits: 1 };
    }
}

/** Two-digit years land within 80 years before and 20 years after today, like Java's SimpleDateFormat. */
export function expandYear(year: number, tokenLength: number, today = new Date()): number {
    if (tokenLength !== 2 || year >= 100) {
        return year;
    }
    const pivot = today.getFullYear() + 20;
    const century = Math.floor(pivot / 100) * 100;
    const candidate = century + year;
    return candidate > pivot ? candidate - 100 : candidate;
}

/**
 * Builds a date from typed parts. Returns undefined while a part is missing and null when the parts don't form a
 * real date (like February 30). Parts the pattern doesn't have come from the start of the period ("MMM yyyy" gives
 * the 1st of the month at 00:00), except that a time-only pattern keeps the reference date's day and a date-only
 * pattern with days keeps the reference date's time.
 */
export function buildDate(parts: DateParts, tokens: Token[], reference?: Date): Date | null | undefined {
    const segments = segmentTokens(tokens);
    if (segments.some(token => parts[token.type] === undefined)) {
        return undefined;
    }
    const has = (type: SegmentType): boolean => segments.some(token => token.type === type);
    const hasDate = has("year") || has("month") || has("quarter") || has("day");
    const base = reference ?? new Date();

    const yearToken = segments.find(token => token.type === "year");
    const year = yearToken ? expandYear(parts.year!, yearToken.length) : base.getFullYear();
    const month = has("month")
        ? parts.month! - 1
        : has("quarter")
          ? (parts.quarter! - 1) * 3
          : hasDate
            ? has("day")
                ? base.getMonth()
                : 0
            : base.getMonth();
    const day = has("day") ? parts.day! : hasDate ? 1 : base.getDate();

    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    const hourToken = segments.find(token => token.type === "hour");
    if (hasTime(tokens)) {
        if (hourToken) {
            const value = parts.hour!;
            const pm = parts.dayPeriod === 1;
            hours =
                hourToken.letter === "H"
                    ? value
                    : hourToken.letter === "k"
                      ? value % 24
                      : hourToken.letter === "K"
                        ? value + (pm ? 12 : 0)
                        : (value % 12) + (pm ? 12 : 0);
        }
        minutes = parts.minute ?? 0;
        seconds = parts.second ?? 0;
    } else if (reference && has("day")) {
        hours = reference.getHours();
        minutes = reference.getMinutes();
        seconds = reference.getSeconds();
    }
    const ms = parts.millisecond ?? 0;

    if (month < 0 || month > 11 || day < 1 || day > getDaysInMonth(new Date(year, month, 1))) {
        return null;
    }
    const date = new Date(year, month, day, hours, minutes, seconds, ms);
    if (year < 100) {
        date.setFullYear(year);
    }
    return date;
}

function matchName(text: string, names: string[]): { index: number; length: number } | undefined {
    const lower = text.toLowerCase();
    let best: { index: number; length: number } | undefined;
    names.forEach((name, index) => {
        const candidate = name.toLowerCase().replace(/\.$/, "");
        if (candidate && lower.startsWith(candidate) && (!best || candidate.length > best.length)) {
            best = { index, length: candidate.length };
        }
    });
    if (best) {
        // "Sept" against "Sep": take the rest of the word too.
        best.length += /^[\p{L}.]*/u.exec(text.slice(best.length))![0].length;
    }
    return best;
}

/** Finds month names by prefix, so "sep", "Sept" and "September" all work. */
export function matchMonthPrefix(text: string, locale: LocaleInfo): number[] {
    const lower = text.toLowerCase();
    if (!lower) {
        return [];
    }
    const matches = new Set<number>();
    [locale.monthsLong, locale.monthsShort].forEach(names =>
        names.forEach((name, index) => {
            if (name.toLowerCase().startsWith(lower)) {
                matches.add(index);
            }
        })
    );
    return [...matches];
}

/**
 * Reads text typed or pasted in the pattern's format, forgiving about separators and padding:
 * with "dd/MM/yyyy", "1/2/2026", "01-02-2026" and "01022026" all work.
 */
export function parseWithTokens(
    text: string,
    tokens: Token[],
    locale: LocaleInfo,
    reference?: Date
): Date | null | undefined {
    const input = text.trim();
    if (!input) {
        return undefined;
    }
    const parts: DateParts = {};
    let pos = 0;
    const skipSeparators = (): void => {
        while (pos < input.length && !/[\p{L}\p{N}]/u.test(input[pos])) {
            pos++;
        }
    };
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.kind === "literal") {
            if (input.slice(pos, pos + token.text.length).toLowerCase() === token.text.toLowerCase()) {
                pos += token.text.length;
            } else {
                skipSeparators();
            }
            continue;
        }
        skipSeparators();
        if (token.kind === "display") {
            if (token.letter === "E") {
                const name = matchName(input.slice(pos), [...locale.weekdaysLong, ...locale.weekdaysShort]);
                pos += name?.length ?? 0;
            } else {
                pos += /^[+-]?\d*/.exec(input.slice(pos))?.[0].length ?? 0;
            }
            continue;
        }
        if (token.type === "dayPeriod") {
            const rest = input.slice(pos).toLowerCase();
            const index = locale.dayPeriods.findIndex(p => rest.startsWith(p.toLowerCase()));
            if (index >= 0) {
                parts.dayPeriod = index;
                pos += locale.dayPeriods[index].length;
            } else if (/^[ap]/.test(rest)) {
                parts.dayPeriod = rest.startsWith("a") ? 0 : 1;
                pos += /^[ap]\.?m?\.?/.exec(rest)?.[0].length ?? 1;
            } else {
                return null;
            }
            continue;
        }
        if (token.type === "month" && token.length >= 3) {
            const name = matchName(input.slice(pos), [...locale.monthsLong, ...locale.monthsShort]);
            if (name) {
                parts.month = (name.index % 12) + 1;
                pos += name.length;
                continue;
            }
        }
        if (token.type === "quarter") {
            const match = /^q?\s*([1-4])/i.exec(input.slice(pos));
            if (!match) {
                return null;
            }
            parts.quarter = Number(match[1]);
            pos += match[0].length;
            continue;
        }
        const run = /^\d+/.exec(input.slice(pos))?.[0];
        if (!run) {
            return null;
        }
        const { digits } = segmentBounds(token, parts);
        // Unseparated input ("01022026") is cut at each segment's width.
        const value = run.slice(0, digits);
        parts[token.type] =
            token.type === "year" && token.length !== 2 && value.length === 2
                ? expandYear(Number(value), 2)
                : Number(value);
        pos += value.length;
    }
    if (input.slice(pos).trim()) {
        return null;
    }
    if (is12Hour(tokens) && parts.dayPeriod === undefined && hasSegment(tokens, "dayPeriod")) {
        parts.dayPeriod = 0;
    }
    for (const token of segmentTokens(tokens)) {
        const value = parts[token.type];
        if (value === undefined) {
            return null;
        }
        const bounds = segmentBounds(token, parts);
        if (token.type !== "year" && (value < bounds.min || value > bounds.max)) {
            return null;
        }
    }
    return buildDate(parts, tokens, reference);
}
