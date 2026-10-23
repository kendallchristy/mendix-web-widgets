export interface NumberFormatOptions {
    /** Number of decimals, or a negative number for "as many as needed, up to 2". */
    decimals: number;
    prefix?: string;
    suffix?: string;
    thousandsSeparator: boolean;
    /** 1.2K, 3.4M and so on. */
    compact: boolean;
    locale?: string;
}

export type NumberFormatter = (value: number | null | undefined) => string;

export function createNumberFormatter(options: NumberFormatOptions): NumberFormatter {
    const fixed = options.decimals >= 0;
    const format = new Intl.NumberFormat(options.locale, {
        useGrouping: options.thousandsSeparator,
        notation: options.compact ? "compact" : "standard",
        minimumFractionDigits: fixed ? options.decimals : 0,
        maximumFractionDigits: fixed ? options.decimals : options.compact ? 1 : 2
    });
    const prefix = options.prefix ?? "";
    const suffix = options.suffix ?? "";
    return value => {
        if (value == null || Number.isNaN(value)) {
            return "";
        }
        // Keep the minus sign in front of a currency prefix: -$1,200 rather than $-1,200.
        const sign = value < 0 ? "-" : "";
        return `${sign}${prefix}${format.format(Math.abs(value))}${suffix}`;
    };
}

export const defaultNumberFormat: NumberFormatOptions = {
    decimals: -1,
    thousandsSeparator: true,
    compact: false
};

/** The number format properties every chart widget has, as Studio Pro hands them over. */
export interface NumberFormatProps {
    decimals: number | null;
    prefix: string;
    suffix: string;
    thousandsSeparator: boolean;
    compactNumbers: boolean;
}

export function numberFormatFromProps(props: NumberFormatProps): NumberFormatOptions {
    return {
        decimals: props.decimals ?? -1,
        prefix: props.prefix,
        suffix: props.suffix,
        thousandsSeparator: props.thousandsSeparator,
        compact: props.compactNumbers
    };
}

/** Formats a share, where 1 is 100%. */
export function createPercentFormatter(decimals: number, locale?: string): NumberFormatter {
    const format = new Intl.NumberFormat(locale, {
        style: "percent",
        minimumFractionDigits: Math.max(0, decimals),
        maximumFractionDigits: Math.max(0, decimals)
    });
    return value => (value == null || !Number.isFinite(value) ? "" : format.format(value));
}
