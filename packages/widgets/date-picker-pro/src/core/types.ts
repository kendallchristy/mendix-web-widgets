/** Which calendar the picker shows. */
export type Granularity = "day" | "month" | "quarter" | "year" | "time";

export type SelectionType = "single" | "range";

/** A single date uses `start` only. Dates are wall-clock times in the browser's zone (see zone.ts). */
export interface PickerValue {
    start?: Date;
    end?: Date;
}

export type Edge = "start" | "end";
