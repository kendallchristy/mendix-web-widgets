import type { ReactElement } from "react";

import type { DatePickerProPreviewProps } from "../typings/DatePickerProProps";
import { DatePickerView } from "./components/DatePickerView";
import { defaultTexts, type PickerConfig } from "./components/types";
import { getLocaleInfo, intlMediumPattern } from "./core/locale";
import { granularityOf, hasTime, tokenize } from "./core/pattern";
import { builtInPresetIds, builtInPresetValue, presetFits } from "./core/presets";

const monthPatterns = {
    FULL: "MMMM yyyy",
    ABBREVIATION: "MMM yyyy",
    PADDED: "MM yyyy",
    MIN: "M yyyy"
};
const presetKeys = [
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

/** A static picker for Studio Pro's design mode: no data, today's month, the configured look. */
function previewConfig(props: DatePickerProPreviewProps): PickerConfig {
    const locale = getLocaleInfo();
    const pattern =
        props.dateFormat === "DATE"
            ? locale.patterns.date
            : props.dateFormat === "TIME"
              ? locale.patterns.time
              : props.dateFormat === "DATETIME"
                ? locale.patterns.datetime
                : props.dateFormat === "MONTH"
                  ? monthPatterns[props.monthFormat]
                  : props.dateFormat === "QUARTER"
                    ? "yyyy QQQ"
                    : props.dateFormat === "YEAR"
                      ? "yyyy"
                      : props.customDateFormat || locale.patterns.date;
    const tokens = tokenize(pattern);
    const selection = props.selectionType === "RANGE" ? "range" : "single";
    const granularity = granularityOf(tokens);
    const record = props as unknown as Record<string, unknown>;
    const weekStartsOn =
        props.weekNumbering === "ISO" || props.firstDayOfWeek === "MONDAY"
            ? 1
            : props.firstDayOfWeek === "SUNDAY"
              ? 0
              : props.firstDayOfWeek === "SATURDAY"
                ? 6
                : locale.firstDayOfWeek;
    const months = Number(props.monthsToDisplay) || (selection === "range" ? 2 : 1);
    const attribute = selection === "range" ? props.startDateAttribute : props.dateAttribute;
    return {
        selection,
        granularity,
        tokens,
        displayTokens: props.dateFormat === "DATE" ? tokenize(intlMediumPattern(locale.languageTag, false)) : tokens,
        hasTime: hasTime(tokens),
        locale,
        weekStartsOn,
        isoWeek: props.weekNumbering === "ISO",
        showWeekNumbers: props.showWeekNumbers === "true",
        showOutsideDays: props.showOutsideDays,
        monthsToDisplay: Math.min(Math.max(months, 1), 3),
        showPreviousMonths: false,
        trigger: props.triggerStyle === "BUTTON" ? "button" : props.triggerStyle === "INLINE" ? "inline" : "input",
        segmented: props.typingMode === "SEGMENTED",
        relativeTyping: props.relativeTyping,
        showIcon: props.showIcon,
        iconBeside: props.iconPosition === "BESIDE",
        clearable: false,
        readOnly: false,
        readOnlyAsText: false,
        presets: props.showPresets
            ? builtInPresetIds
                  .filter(
                      (id, i) => record[`preset${presetKeys[i]}`] === true && presetFits(id, selection, granularity)
                  )
                  .map(id => ({
                      id,
                      label: String(record[`preset${presetKeys[builtInPresetIds.indexOf(id)]}Label`] || id),
                      value: builtInPresetValue(id, new Date(), weekStartsOn)
                  }))
            : [],
        isDayDisabled: () => false,
        rangeRules: {},
        timeConstraints: {},
        timeInterval: 60,
        markers: new Map(),
        applyMode: props.applyMode === "ALWAYS" || (props.applyMode === "AUTO" && selection === "range"),
        closeOnSelect: true,
        rangeEndAt: "start",
        alignment: "left",
        showArrow: false,
        mobileBreakpoint: 0,
        density: props.density === "COMPACT" ? "compact" : props.density === "LARGE" ? "large" : "default",
        helpButton: props.helpButton === "BESIDE" ? "beside" : props.helpButton === "POPUP" ? "popup" : "hidden",
        showTodayButton: props.showTodayButton,
        texts: {
            ...defaultTexts,
            placeholder: props.placeholder || (attribute ? `[${attribute}]` : ""),
            endPlaceholder: props.endPlaceholder,
            customPreset: props.customPresetLabel || defaultTexts.customPreset,
            apply: props.applyLabel || defaultTexts.apply,
            cancel: props.cancelLabel || defaultTexts.cancel,
            start: props.startLabel || defaultTexts.start,
            end: props.endLabel || defaultTexts.end
        }
    };
}

export function preview(props: DatePickerProPreviewProps): ReactElement {
    return <DatePickerView config={previewConfig(props)} value={{}} onCommit={() => undefined} />;
}

export function getPreviewCss(): string {
    // Studio Pro expects the compiled stylesheet as a string, which the widget build provides for require()
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("./ui/DatePickerPro.scss");
}
