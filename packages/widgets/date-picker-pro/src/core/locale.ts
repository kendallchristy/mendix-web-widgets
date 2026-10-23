// Language, names and default patterns for the current user. Mendix exposes the user's language settings
// on window.mx; Intl fills anything it doesn't provide, so the widget also works in previews and tests.

export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface LocaleInfo {
    languageTag: string;
    /** 0 = Sunday. */
    firstDayOfWeek: WeekDay;
    patterns: { date: string; time: string; datetime: string };
    monthsLong: string[];
    monthsShort: string[];
    /** Sunday first. */
    weekdaysLong: string[];
    /** Sunday first. */
    weekdaysShort: string[];
    dayPeriods: [string, string];
}

interface MendixLocaleConfig {
    languageTag?: string;
    code?: string;
    firstDayOfWeek?: number;
    patterns?: { date?: string; time?: string; datetime?: string };
    dates?: {
        monthNames?: string[];
        shortMonthNames?: string[];
        weekdayNames?: string[];
        shortWeekdayNames?: string[];
        dayPeriods?: string[];
    };
}

function mendixLocale(): MendixLocaleConfig | undefined {
    try {
        const mx = (window as unknown as { mx?: { session?: { getConfig?: () => { locale?: MendixLocaleConfig } } } })
            .mx;
        return mx?.session?.getConfig?.()?.locale;
    } catch {
        return undefined;
    }
}

function isNameList(list: string[] | undefined, length: number): list is string[] {
    return Array.isArray(list) && list.length === length && list.every(name => typeof name === "string" && name);
}

function intlNames(languageTag: string): Omit<LocaleInfo, "languageTag" | "firstDayOfWeek" | "patterns"> {
    const month = (style: "long" | "short"): string[] => {
        const format = new Intl.DateTimeFormat(languageTag, { month: style, timeZone: "UTC" });
        return Array.from({ length: 12 }, (_, i) => format.format(new Date(Date.UTC(2021, i, 1))));
    };
    const weekday = (style: "long" | "short"): string[] => {
        const format = new Intl.DateTimeFormat(languageTag, { weekday: style, timeZone: "UTC" });
        // 2021-01-03 was a Sunday
        return Array.from({ length: 7 }, (_, i) => format.format(new Date(Date.UTC(2021, 0, 3 + i))));
    };
    const period = (hour: number): string =>
        new Intl.DateTimeFormat(languageTag, { hour: "numeric", hour12: true, timeZone: "UTC" })
            .formatToParts(new Date(Date.UTC(2021, 0, 1, hour)))
            .find(part => part.type === "dayPeriod")?.value ?? (hour < 12 ? "AM" : "PM");
    return {
        monthsLong: month("long"),
        monthsShort: month("short"),
        weekdaysLong: weekday("long"),
        weekdaysShort: weekday("short"),
        dayPeriods: [period(9), period(15)]
    };
}

/** Builds a Mendix-style pattern (like "MM/dd/yyyy") from the browser's formatting for this language. */
export function intlPattern(languageTag: string, kind: "date" | "time" | "datetime"): string {
    const options: Intl.DateTimeFormatOptions =
        kind === "date"
            ? { year: "numeric", month: "2-digit", day: "2-digit" }
            : kind === "time"
              ? { hour: "2-digit", minute: "2-digit" }
              : { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" };
    const parts = new Intl.DateTimeFormat(languageTag, { ...options, timeZone: "UTC" }).formatToParts(
        new Date(Date.UTC(2021, 10, 22, 15, 4))
    );
    const hour12 = parts.some(part => part.type === "dayPeriod");
    return parts
        .map(part => {
            switch (part.type) {
                case "year":
                    return "yyyy";
                case "month":
                    return "MM";
                case "day":
                    return "dd";
                case "hour":
                    return hour12 ? "hh" : "HH";
                case "minute":
                    return "mm";
                case "dayPeriod":
                    return "a";
                case "literal":
                    return /[A-Za-z]/.test(part.value) ? `'${part.value.replace(/'/g, "''")}'` : part.value;
                default:
                    return "";
            }
        })
        .join("");
}

function browserLanguage(): string {
    try {
        return document.documentElement.lang || navigator.language || "en-US";
    } catch {
        return "en-US";
    }
}

function supportedTag(tag: string): string {
    try {
        return Intl.DateTimeFormat.supportedLocalesOf([tag]).length ? tag : "en-US";
    } catch {
        return "en-US";
    }
}

function intlFirstDayOfWeek(languageTag: string): WeekDay {
    try {
        const locale = new Intl.Locale(languageTag) as Intl.Locale & {
            getWeekInfo?: () => { firstDay: number };
            weekInfo?: { firstDay: number };
        };
        const firstDay = locale.getWeekInfo?.().firstDay ?? locale.weekInfo?.firstDay;
        if (firstDay) {
            return (firstDay % 7) as WeekDay;
        }
    } catch {
        // Older browsers: fall through to the common default.
    }
    return /^en-(US|CA)|^(ja|ko|zh|he|pt-BR)/.test(languageTag) ? 0 : 1;
}

export function buildLocaleInfo(config: MendixLocaleConfig = {}): LocaleInfo {
    const languageTag = supportedTag((config.languageTag ?? config.code ?? browserLanguage()).replace("_", "-"));
    const names = intlNames(languageTag);
    const dates = config.dates ?? {};
    const firstDayOfWeek =
        typeof config.firstDayOfWeek === "number" && config.firstDayOfWeek >= 0 && config.firstDayOfWeek <= 6
            ? (config.firstDayOfWeek as WeekDay)
            : intlFirstDayOfWeek(languageTag);
    return {
        languageTag,
        firstDayOfWeek,
        patterns: {
            date: config.patterns?.date || intlPattern(languageTag, "date"),
            time: config.patterns?.time || intlPattern(languageTag, "time"),
            datetime: config.patterns?.datetime || intlPattern(languageTag, "datetime")
        },
        monthsLong: isNameList(dates.monthNames, 12) ? dates.monthNames : names.monthsLong,
        monthsShort: isNameList(dates.shortMonthNames, 12) ? dates.shortMonthNames : names.monthsShort,
        weekdaysLong: isNameList(dates.weekdayNames, 7) ? dates.weekdayNames : names.weekdaysLong,
        weekdaysShort: isNameList(dates.shortWeekdayNames, 7) ? dates.shortWeekdayNames : names.weekdaysShort,
        dayPeriods: isNameList(dates.dayPeriods, 2) ? [dates.dayPeriods[0], dates.dayPeriods[1]] : names.dayPeriods
    };
}

let cached: LocaleInfo | undefined;

/** The current user's locale. Read once per page load, like the Mendix client does. */
export function getLocaleInfo(): LocaleInfo {
    if (!cached) {
        cached = buildLocaleInfo(mendixLocale());
    }
    return cached;
}

/** A medium-length pattern for showing dates in the button trigger, like "MMM d, yyyy" for en-US. */
export function intlMediumPattern(languageTag: string, withTime: boolean): string {
    const parts = new Intl.DateTimeFormat(languageTag, {
        year: "numeric",
        month: "short",
        day: "numeric",
        ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
        timeZone: "UTC"
    }).formatToParts(new Date(Date.UTC(2021, 10, 22, 15, 4)));
    const hour12 = parts.some(part => part.type === "dayPeriod");
    return parts
        .map(part => {
            switch (part.type) {
                case "year":
                    return "yyyy";
                case "month":
                    return /^\d+$/.test(part.value) ? "M" : "MMM";
                case "day":
                    return "d";
                case "hour":
                    return hour12 ? "h" : "HH";
                case "minute":
                    return "mm";
                case "dayPeriod":
                    return "a";
                case "literal":
                    return /[A-Za-z]/.test(part.value) ? `'${part.value.replace(/'/g, "''")}'` : part.value;
                default:
                    return "";
            }
        })
        .join("");
}
