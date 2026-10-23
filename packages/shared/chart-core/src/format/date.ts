export type DateLevel = "year" | "quarter" | "month" | "week" | "day";

export const DATE_LEVELS: DateLevel[] = ["year", "quarter", "month", "week", "day"];

export interface DateBucket {
    /** Sortable and unique within a level. */
    key: string;
    start: Date;
    /** Exclusive. */
    end: Date;
}

function startOfIsoWeek(date: Date): Date {
    const day = (date.getDay() + 6) % 7; // Monday = 0
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() - day);
}

const pad = (n: number, length = 2): string => String(n).padStart(length, "0");

/** The bucket a date falls in at a drilldown level, in local time. */
export function bucketDate(date: Date, level: DateLevel): DateBucket {
    const y = date.getFullYear();
    const m = date.getMonth();
    switch (level) {
        case "year":
            return { key: `${y}`, start: new Date(y, 0, 1), end: new Date(y + 1, 0, 1) };
        case "quarter": {
            const q = Math.floor(m / 3);
            return { key: `${y}-Q${q + 1}`, start: new Date(y, q * 3, 1), end: new Date(y, q * 3 + 3, 1) };
        }
        case "month":
            return { key: `${y}-${pad(m + 1)}`, start: new Date(y, m, 1), end: new Date(y, m + 1, 1) };
        case "week": {
            const start = startOfIsoWeek(date);
            const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
            return { key: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}w`, start, end };
        }
        case "day": {
            const start = new Date(y, m, date.getDate());
            return {
                key: `${y}-${pad(m + 1)}-${pad(date.getDate())}`,
                start,
                end: new Date(y, m, date.getDate() + 1)
            };
        }
    }
}

const dateTimeFormats = new Map<string, Intl.DateTimeFormat>();

/**
 * A shared Intl.DateTimeFormat for a locale and options. Creating one is slow, and charts format thousands of
 * dates per build, so each combination is created once.
 */
export function dateTimeFormat(locale: string | undefined, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
    const key = `${locale ?? ""}|${JSON.stringify(options)}`;
    let format = dateTimeFormats.get(key);
    if (!format) {
        format = new Intl.DateTimeFormat(locale, options);
        dateTimeFormats.set(key, format);
    }
    return format;
}

/**
 * A short label for a bucket. The year is added to months, weeks and days only when the buckets on screen span
 * more than one year.
 */
export function formatBucket(bucket: DateBucket, level: DateLevel, showYear: boolean, locale?: string): string {
    const year = bucket.start.getFullYear();
    switch (level) {
        case "year":
            return `${year}`;
        case "quarter":
            return showYear
                ? `Q${Math.floor(bucket.start.getMonth() / 3) + 1} ${year}`
                : `Q${Math.floor(bucket.start.getMonth() / 3) + 1}`;
        case "month":
            return dateTimeFormat(locale, showYear ? { month: "short", year: "numeric" } : { month: "short" }).format(
                bucket.start
            );
        case "week":
        case "day":
            return dateTimeFormat(
                locale,
                showYear ? { month: "short", day: "numeric", year: "numeric" } : { month: "short", day: "numeric" }
            ).format(bucket.start);
    }
}

export function nextDateLevel(level: DateLevel, deepest: DateLevel): DateLevel | undefined {
    const index = DATE_LEVELS.indexOf(level);
    if (index >= DATE_LEVELS.indexOf(deepest)) {
        return undefined;
    }
    return DATE_LEVELS[index + 1];
}

/**
 * Formats a date with an ECharts-style template such as `{MMM} {d}` or `{yyyy}-{MM}-{dd}`, for axes ECharts doesn't
 * format itself (category and calendar axes). Month names follow the locale.
 */
export function formatDateTemplate(date: Date, template: string, locale?: string): string {
    const parts: Record<string, () => string> = {
        yyyy: () => String(date.getFullYear()),
        yy: () => pad(date.getFullYear() % 100),
        MMMM: () => dateTimeFormat(locale, { month: "long" }).format(date),
        MMM: () => dateTimeFormat(locale, { month: "short" }).format(date),
        MM: () => pad(date.getMonth() + 1),
        M: () => String(date.getMonth() + 1),
        dd: () => pad(date.getDate()),
        d: () => String(date.getDate()),
        eeee: () => dateTimeFormat(locale, { weekday: "long" }).format(date),
        ee: () => dateTimeFormat(locale, { weekday: "short" }).format(date),
        HH: () => pad(date.getHours()),
        H: () => String(date.getHours()),
        mm: () => pad(date.getMinutes()),
        ss: () => pad(date.getSeconds())
    };
    return template.replace(/\{(\w+)\}/g, (whole, key: string) => parts[key]?.() ?? whole);
}

/**
 * A date label: the template when one is set, otherwise a short date, with the year only when the dates on screen
 * span more than one year, and the time only when some have one.
 */
export function formatDateLabel(
    date: Date,
    options: { template?: string; showYear: boolean; showTime?: boolean },
    locale?: string
): string {
    if (options.template) {
        return formatDateTemplate(date, options.template, locale);
    }
    return dateTimeFormat(locale, {
        month: "short",
        day: "numeric",
        ...(options.showYear ? { year: "numeric" } : {}),
        ...(options.showTime ? { hour: "numeric", minute: "2-digit" } : {})
    }).format(date);
}
