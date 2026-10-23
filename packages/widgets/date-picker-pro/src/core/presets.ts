// Built-in and custom presets for the sidebar.
import { addDays, addMonths, addQuarters, addWeeks, addYears, endOfWeek, startOfDay, startOfWeek } from "date-fns";

import type { WeekDay } from "./locale";
import { endOfPeriod, samePeriod, startOfPeriod, unitOf } from "./periods";
import type { Granularity, PickerValue, SelectionType } from "./types";

export type BuiltInPresetId =
    | "today"
    | "yesterday"
    | "tomorrow"
    | "thisWeek"
    | "lastWeek"
    | "thisMonth"
    | "lastMonth"
    | "thisQuarter"
    | "lastQuarter"
    | "thisYear"
    | "lastYear"
    | "allTime";

export const builtInPresetIds: BuiltInPresetId[] = [
    "today",
    "yesterday",
    "tomorrow",
    "thisWeek",
    "lastWeek",
    "thisMonth",
    "lastMonth",
    "thisQuarter",
    "lastQuarter",
    "thisYear",
    "lastYear",
    "allTime"
];

export interface Preset {
    id: string;
    label: string;
    /** Empty for "All time". */
    value: PickerValue;
}

/** The range a built-in preset stands for, from the first to the last day of the period. */
export function builtInPresetValue(id: BuiltInPresetId, today: Date, weekStartsOn: WeekDay): PickerValue {
    const day = startOfDay(today);
    const week = (date: Date): PickerValue => ({
        start: startOfWeek(date, { weekStartsOn }),
        end: startOfDay(endOfWeek(date, { weekStartsOn }))
    });
    const period = (date: Date, unit: "month" | "quarter" | "year"): PickerValue => ({
        start: startOfPeriod(date, unit),
        end: startOfDay(endOfPeriod(date, unit))
    });
    switch (id) {
        case "today":
            return { start: day, end: day };
        case "yesterday":
            return { start: addDays(day, -1), end: addDays(day, -1) };
        case "tomorrow":
            return { start: addDays(day, 1), end: addDays(day, 1) };
        case "thisWeek":
            return week(day);
        case "lastWeek":
            return week(addWeeks(day, -1));
        case "thisMonth":
            return period(day, "month");
        case "lastMonth":
            return period(addMonths(day, -1), "month");
        case "thisQuarter":
            return period(day, "quarter");
        case "lastQuarter":
            return period(addQuarters(day, -1), "quarter");
        case "thisYear":
            return period(day, "year");
        case "lastYear":
            return period(addYears(day, -1), "year");
        case "allTime":
            return {};
    }
}

/** Whether a built-in preset makes sense for the picker: single dates only get day presets. */
export function presetFits(id: BuiltInPresetId, selection: SelectionType, granularity: Granularity): boolean {
    if (granularity === "time") {
        return false;
    }
    if (selection === "single") {
        return id === "today" || id === "yesterday" || id === "tomorrow";
    }
    const unit = unitOf(granularity);
    const presetUnit: Record<BuiltInPresetId, Granularity> = {
        today: "day",
        yesterday: "day",
        tomorrow: "day",
        thisWeek: "day",
        lastWeek: "day",
        thisMonth: "month",
        lastMonth: "month",
        thisQuarter: "quarter",
        lastQuarter: "quarter",
        thisYear: "year",
        lastYear: "year",
        allTime: "day"
    };
    const order: Granularity[] = ["day", "month", "quarter", "year"];
    // A month picker can't show "This week"; a quarter picker can't show "This month".
    return id === "allTime" || order.indexOf(presetUnit[id]) >= order.indexOf(unit);
}

/** The preset that matches the value, compared by period, so a preset still lights up after reloading. */
export function findActivePreset(
    presets: Preset[],
    value: PickerValue,
    selection: SelectionType,
    granularity: Granularity
): Preset | undefined {
    const unit = unitOf(granularity);
    return presets.find(preset => {
        if (!preset.value.start && !preset.value.end) {
            return !value.start && !value.end && preset.id === "allTime";
        }
        if (selection === "single") {
            return samePeriod(preset.value.start, value.start, unit);
        }
        return samePeriod(preset.value.start, value.start, unit) && samePeriod(preset.value.end, value.end, unit);
    });
}
