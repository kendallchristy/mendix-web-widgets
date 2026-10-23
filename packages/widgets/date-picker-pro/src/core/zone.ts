// Mendix stores a non-localized date as the UTC instant of its wall-clock time ("2026-01-10 00:00 UTC"),
// and a localized date as a real instant shown in the user's zone. The picker works in local wall-clock time,
// so non-localized values are shifted on the way in and out.

/** Converts an attribute value to the wall-clock date the picker shows. */
export function fromAttribute(date: Date | undefined, utc: boolean): Date | undefined {
    if (!date || !utc) {
        return date;
    }
    return new Date(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds(),
        date.getUTCMilliseconds()
    );
}

/** Converts a wall-clock date from the picker back to the attribute's representation. */
export function toAttribute(date: Date | undefined, utc: boolean): Date | undefined {
    if (!date || !utc) {
        return date;
    }
    return new Date(
        Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
            date.getSeconds(),
            date.getMilliseconds()
        )
    );
}

interface ProbeFormatter {
    type?: string;
    withConfig?: (config: { type: "custom"; pattern: string }) => {
        format: (value: Date | undefined) => string;
    };
}

const pad = (value: number): string => String(value).padStart(2, "0");

/**
 * Detects whether Mendix shows an attribute in UTC (not localized) by formatting a known instant with the
 * attribute's own formatter. Returns undefined when it can't tell, for example when the browser itself runs in UTC,
 * where both kinds behave the same.
 */
export function detectUtc(formatter: unknown): boolean | undefined {
    const probe = new Date(Date.UTC(2020, 5, 15, 12, 30));
    if (probe.getTimezoneOffset() === 0) {
        return undefined;
    }
    const candidate = formatter as ProbeFormatter | undefined;
    if (candidate?.type !== "datetime" || typeof candidate.withConfig !== "function") {
        return undefined;
    }
    try {
        const shown = candidate.withConfig({ type: "custom", pattern: "yyyy-MM-dd HH:mm" }).format(probe);
        const utc = `${probe.getUTCFullYear()}-${pad(
            probe.getUTCMonth() + 1
        )}-${pad(probe.getUTCDate())} ${pad(probe.getUTCHours())}:${pad(probe.getUTCMinutes())}`;
        const local = `${probe.getFullYear()}-${pad(
            probe.getMonth() + 1
        )}-${pad(probe.getDate())} ${pad(probe.getHours())}:${pad(probe.getMinutes())}`;
        if (shown === utc) {
            return true;
        }
        if (shown === local) {
            return false;
        }
    } catch {
        // Formatter without custom pattern support.
    }
    return undefined;
}
