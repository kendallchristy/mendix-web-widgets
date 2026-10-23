import { hidePropertiesIn, type Problem, type Properties } from "@mendix/pluggable-widgets-tools";

import type { DatePickerProPreviewProps } from "../typings/DatePickerProProps";

type Key = keyof DatePickerProPreviewProps;

const presetNames = [
    "Today",
    "Yesterday",
    "Tomorrow",
    "ThisWeek",
    "LastWeek",
    "ThisMonth",
    "LastMonth",
    "ThisQuarter",
    "LastQuarter",
    "ThisYear",
    "LastYear",
    "AllTime"
];

function hasTimeFormat(values: DatePickerProPreviewProps): boolean {
    return (
        values.dateFormat === "TIME" ||
        values.dateFormat === "DATETIME" ||
        (values.dateFormat === "CUSTOM" && /[HhKkms]/.test(values.customDateFormat.replace(/'[^']*'/g, "")))
    );
}

export function getProperties(values: DatePickerProPreviewProps, defaultProperties: Properties): Properties {
    const hide = (keys: Key[]): void => hidePropertiesIn(defaultProperties, values, keys);
    const range = values.selectionType === "RANGE";

    if (range) {
        hide(["dateAttribute"]);
    } else {
        hide([
            "startDateAttribute",
            "endDateAttribute",
            "rangeEndAt",
            "endPlaceholder",
            "minRangeLength",
            "maxRangeLength",
            "excludeDisabledInRange",
            "rangeTooShortMessage",
            "rangeTooLongMessage",
            "rangeCrossesDisabledMessage",
            "customPresetLabel",
            "presetSourceEnd"
        ]);
    }
    if (values.dateFormat !== "MONTH") {
        hide(["monthFormat"]);
    }
    if (values.dateFormat !== "CUSTOM") {
        hide(["customDateFormat"]);
    }
    if (!hasTimeFormat(values)) {
        hide([
            "timeInterval",
            "timeCaption",
            "minTime",
            "maxTime",
            "specificTimesMode",
            "specificTimesSource",
            "specificTimesAttribute"
        ]);
    }
    if (values.specificDaysMode === "OFF") {
        hide(["specificDaysSource", "specificDaysAttribute"]);
    }
    if (values.intervalDaysMode === "OFF") {
        hide(["intervalDaysSource", "intervalStartAttribute", "intervalEndAttribute"]);
    }
    if (values.specificTimesMode === "OFF") {
        hide(["specificTimesSource", "specificTimesAttribute"]);
    }
    if (values.typingMode === "TEXT") {
        hide(["maskErrorText", "includeInvalidChar"]);
    }
    if (values.triggerStyle === "INLINE") {
        hide(["showIcon", "iconPosition", "customIcon", "alignment", "showArrow", "placeholder", "endPlaceholder"]);
    } else if (!values.showIcon) {
        hide(["iconPosition", "customIcon"]);
    } else if (values.triggerStyle === "BUTTON") {
        hide(["iconPosition"]);
    }
    if (!values.showTodayButton) {
        hide(["todayButtonText"]);
    }
    if (!values.useCustomContent) {
        hide(["customContent"]);
    }
    if (!values.useCustomHelp) {
        hide(["customHelp"]);
    }
    if (values.helpButton === "HIDDEN") {
        hide(["useCustomHelp", "customHelp"]);
    }
    if (!values.presetsSource) {
        hide(["presetSourceLabel", "presetSourceStart", "presetSourceEnd"]);
    }
    if (!values.markersSource) {
        hide(["markerDateAttribute", "markerColor", "markerLabel"]);
    }
    const record = values as unknown as Record<string, unknown>;
    if (!values.showPresets) {
        hide([
            ...presetNames.flatMap(name => [`preset${name}`, `preset${name}Label`] as Key[]),
            "customPresetLabel",
            "customPresets",
            "presetsSource",
            "presetSourceLabel",
            "presetSourceStart",
            "presetSourceEnd",
            "customPresetsPosition"
        ]);
    } else {
        hide(presetNames.filter(name => !record[`preset${name}`]).map(name => `preset${name}Label` as Key));
    }
    return defaultProperties;
}

export function check(values: DatePickerProPreviewProps): Problem[] {
    const problems: Problem[] = [];
    const require = (property: Key, message: string): void => {
        if (!values[property]) {
            problems.push({ property, message });
        }
    };
    if (values.selectionType === "RANGE") {
        require("startDateAttribute", "Choose the attribute for the start of the range.");
        require("endDateAttribute", "Choose the attribute for the end of the range.");
    } else {
        require("dateAttribute", "Choose the attribute to save the date to.");
    }
    if (values.dateFormat === "CUSTOM") {
        require("customDateFormat", "Enter a custom date format, for example dd-MM-yyyy.");
    }
    if (values.specificDaysMode !== "OFF") {
        require("specificDaysSource", "Choose a data source for the specific days.");
        require("specificDaysAttribute", "Choose the date attribute of the specific days.");
    }
    if (values.intervalDaysMode !== "OFF") {
        require("intervalDaysSource", "Choose a data source for the interval days.");
        require("intervalStartAttribute", "Choose the start attribute of the intervals.");
        require("intervalEndAttribute", "Choose the end attribute of the intervals.");
    }
    if (values.specificTimesMode !== "OFF" && hasTimeFormat(values)) {
        require("specificTimesSource", "Choose a data source for the specific times.");
        require("specificTimesAttribute", "Choose the time attribute of the specific times.");
    }
    if (values.markersSource) {
        require("markerDateAttribute", "Choose the date attribute of the markers.");
    }
    if (values.showPresets && values.presetsSource) {
        require("presetSourceLabel", "Enter a label for the presets from data.");
        require("presetSourceStart", "Choose the start attribute of the presets from data.");
    }
    return problems;
}
