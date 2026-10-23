// Turns the widget's Studio Pro properties into the picker's configuration.
import { Icon } from "mendix/components/web/Icon";
import type { DynamicValue, ListAttributeValue, ListValue } from "mendix";

import type { DatePickerProContainerProps } from "../../typings/DatePickerProProps";
import { defaultTexts, type Marker, type PickerConfig, type PickerTexts } from "../components/types";
import { createDayTest, minutesOfDay, type ListMode } from "../core/constraints";
import { getLocaleInfo, intlMediumPattern, type LocaleInfo, type WeekDay } from "../core/locale";
import { granularityOf, hasTime, tokenize } from "../core/pattern";
import { dayKey } from "../core/periods";
import { builtInPresetIds, builtInPresetValue, presetFits, type BuiltInPresetId, type Preset } from "../core/presets";
import type { SelectionType } from "../core/types";
import { detectUtc, fromAttribute } from "../core/zone";

const monthPatterns = {
    FULL: "MMMM yyyy",
    ABBREVIATION: "MMM yyyy",
    PADDED: "MM yyyy",
    MIN: "M yyyy"
};

export function formatPattern(props: DatePickerProContainerProps, locale: LocaleInfo): string {
    switch (props.dateFormat) {
        case "DATE":
            return locale.patterns.date;
        case "TIME":
            return locale.patterns.time;
        case "DATETIME":
            return locale.patterns.datetime;
        case "MONTH":
            return monthPatterns[props.monthFormat];
        case "QUARTER":
            return "yyyy QQQ";
        case "YEAR":
            return "yyyy";
        case "CUSTOM":
            return props.customDateFormat.value || locale.patterns.date;
    }
}

/** Whether an attribute holds non-localized (UTC) dates, following the Time zone handling property. */
export function attributeIsUtc(props: DatePickerProContainerProps, formatter: unknown, fallback = false): boolean {
    if (props.dateHandling === "UTC") {
        return true;
    }
    if (props.dateHandling === "LOCAL") {
        return false;
    }
    return detectUtc(formatter) ?? fallback;
}

const listMode = (mode: "OFF" | "INCLUDE" | "EXCLUDE"): ListMode =>
    mode === "INCLUDE" ? "include" : mode === "EXCLUDE" ? "exclude" : "off";

function listDates(
    props: DatePickerProContainerProps,
    source: ListValue | undefined,
    attribute: ListAttributeValue<Date> | undefined,
    fallbackUtc: boolean
): Date[] {
    if (!source?.items || !attribute) {
        return [];
    }
    const utc = attributeIsUtc(props, attribute.formatter, fallbackUtc);
    return source.items
        .map(item => fromAttribute(attribute.get(item).value, utc))
        .filter((date): date is Date => !!date);
}

const presetKeys: Record<BuiltInPresetId, string> = {
    today: "Today",
    yesterday: "Yesterday",
    tomorrow: "Tomorrow",
    thisWeek: "ThisWeek",
    lastWeek: "LastWeek",
    thisMonth: "ThisMonth",
    lastMonth: "LastMonth",
    thisQuarter: "ThisQuarter",
    lastQuarter: "LastQuarter",
    thisYear: "ThisYear",
    lastYear: "LastYear",
    allTime: "AllTime"
};

const text = (value: DynamicValue<string> | undefined, fallback: string): string => value?.value ?? fallback;

function buildTexts(props: DatePickerProContainerProps): PickerTexts {
    return {
        placeholder: text(props.placeholder, ""),
        endPlaceholder: text(props.endPlaceholder, ""),
        timeCaption: text(props.timeCaption, defaultTexts.timeCaption),
        todayButton: text(props.todayButtonText, defaultTexts.todayButton),
        customPreset: text(props.customPresetLabel, defaultTexts.customPreset),
        maskError: text(props.maskErrorText, ""),
        includeInvalidChar: props.includeInvalidChar.value ?? true,
        requiredMessage: text(props.requiredMessage, defaultTexts.requiredMessage),
        invalidDate: text(props.invalidDateMessage, defaultTexts.invalidDate),
        rangeTooShort: text(props.rangeTooShortMessage, defaultTexts.rangeTooShort),
        rangeTooLong: text(props.rangeTooLongMessage, defaultTexts.rangeTooLong),
        rangeCrossesDisabled: text(props.rangeCrossesDisabledMessage, defaultTexts.rangeCrossesDisabled),
        calendarButton: text(props.calendarIconLabel, defaultTexts.calendarButton),
        navigatePrefix: text(props.navigateButtonPrefix, defaultTexts.navigatePrefix),
        selectPrefix: text(props.selectPrefix, defaultTexts.selectPrefix),
        weekPrefix: text(props.weekPrefix, defaultTexts.weekPrefix),
        monthPrefix: text(props.monthPrefix, defaultTexts.monthPrefix),
        monthSelect: text(props.monthSelectLabel, defaultTexts.monthSelect),
        yearSelect: text(props.yearSelectLabel, defaultTexts.yearSelect),
        disabled: text(props.disabledLabel, defaultTexts.disabled),
        clear: text(props.clearButtonLabel, defaultTexts.clear),
        start: text(props.startLabel, defaultTexts.start),
        end: text(props.endLabel, defaultTexts.end),
        apply: text(props.applyLabel, defaultTexts.apply),
        cancel: text(props.cancelLabel, defaultTexts.cancel),
        presets: text(props.presetsLabel, defaultTexts.presets),
        help: text(props.helpLabel, defaultTexts.help)
    };
}

function buildPresets(
    props: DatePickerProContainerProps,
    selection: SelectionType,
    granularity: PickerConfig["granularity"],
    weekStartsOn: WeekDay,
    utc: boolean
): Preset[] {
    if (!props.showPresets) {
        return [];
    }
    const today = new Date();
    const record = props as unknown as Record<string, unknown>;
    const builtIn: Preset[] = builtInPresetIds
        .filter(id => record[`preset${presetKeys[id]}`] === true && presetFits(id, selection, granularity))
        .map(id => ({
            id,
            label: (record[`preset${presetKeys[id]}Label`] as DynamicValue<string> | undefined)?.value ?? id,
            value: builtInPresetValue(id, today, weekStartsOn)
        }));

    const custom: Preset[] = props.customPresets
        .filter(preset => preset.label.value)
        .map((preset, index) => ({
            id: `custom-${index}`,
            label: preset.label.value!,
            value: {
                start: preset.start?.value,
                end: selection === "range" ? preset.end?.value : undefined
            }
        }));

    if (props.presetsSource?.items && props.presetSourceStart) {
        const startUtc = attributeIsUtc(props, props.presetSourceStart.formatter, utc);
        const endUtc = props.presetSourceEnd ? attributeIsUtc(props, props.presetSourceEnd.formatter, utc) : utc;
        for (const item of props.presetsSource.items) {
            const label = props.presetSourceLabel?.get(item).value;
            if (!label) {
                continue;
            }
            custom.push({
                id: `data-${item.id}`,
                label,
                value: {
                    start: fromAttribute(props.presetSourceStart.get(item).value, startUtc),
                    end:
                        selection === "range" && props.presetSourceEnd
                            ? fromAttribute(props.presetSourceEnd.get(item).value, endUtc)
                            : undefined
                }
            });
        }
    }
    return props.customPresetsPosition === "BEFORE" ? [...custom, ...builtIn] : [...builtIn, ...custom];
}

function buildMarkers(props: DatePickerProContainerProps, utc: boolean): Map<string, Marker[]> {
    const markers = new Map<string, Marker[]>();
    const { markersSource, markerDateAttribute } = props;
    if (!markersSource?.items || !markerDateAttribute) {
        return markers;
    }
    const markerUtc = attributeIsUtc(props, markerDateAttribute.formatter, utc);
    for (const item of markersSource.items) {
        const date = fromAttribute(markerDateAttribute.get(item).value, markerUtc);
        if (!date) {
            continue;
        }
        const key = dayKey(date);
        const list = markers.get(key) ?? [];
        list.push({
            color: props.markerColor?.get(item).value || undefined,
            label: props.markerLabel?.get(item).value || undefined
        });
        markers.set(key, list);
    }
    return markers;
}

const weekStarts: Record<string, WeekDay | undefined> = {
    MONDAY: 1,
    SUNDAY: 0,
    SATURDAY: 6
};

export interface MendixPickerConfig {
    config: PickerConfig;
    /** Whether the main attribute(s) hold non-localized (UTC) dates. */
    utc: boolean;
}

export function buildConfig(
    props: DatePickerProContainerProps,
    readOnly: boolean,
    locale = getLocaleInfo()
): MendixPickerConfig {
    const selection: SelectionType = props.selectionType === "RANGE" ? "range" : "single";
    const mainAttribute = selection === "range" ? props.startDateAttribute : props.dateAttribute;
    const utc = attributeIsUtc(props, mainAttribute?.formatter);

    const tokens = tokenize(formatPattern(props, locale));
    const granularity = granularityOf(tokens);
    const withTime = hasTime(tokens);
    const displayTokens =
        props.dateFormat === "DATE"
            ? tokenize(intlMediumPattern(locale.languageTag, false))
            : props.dateFormat === "DATETIME"
              ? tokenize(intlMediumPattern(locale.languageTag, true))
              : tokens;

    const weekStartsOn =
        props.weekNumbering === "ISO" ? 1 : (weekStarts[props.firstDayOfWeek] ?? locale.firstDayOfWeek);
    const requestedMonths = Number(props.monthsToDisplay.value ?? 0);
    const monthsToDisplay =
        requestedMonths > 0 ? Math.min(Math.round(requestedMonths), 12) : selection === "range" ? 2 : 1;

    const isDayDisabled = createDayTest({
        min: props.minDate?.value,
        max: props.maxDate?.value,
        specificDays: {
            mode: listMode(props.specificDaysMode),
            days: listDates(props, props.specificDaysSource, props.specificDaysAttribute, true)
        },
        intervals: {
            mode: listMode(props.intervalDaysMode),
            ranges: (() => {
                const { intervalDaysSource, intervalStartAttribute, intervalEndAttribute } = props;
                if (!intervalDaysSource?.items || !intervalStartAttribute || !intervalEndAttribute) {
                    return [];
                }
                const startUtc = attributeIsUtc(props, intervalStartAttribute.formatter, true);
                const endUtc = attributeIsUtc(props, intervalEndAttribute.formatter, true);
                return intervalDaysSource.items.flatMap(item => {
                    const start = fromAttribute(intervalStartAttribute.get(item).value, startUtc);
                    const end = fromAttribute(intervalEndAttribute.get(item).value, endUtc);
                    return start && end ? [{ start, end }] : [];
                });
            })()
        },
        disabledWeekdays: [
            props.disableSunday,
            props.disableMonday,
            props.disableTuesday,
            props.disableWednesday,
            props.disableThursday,
            props.disableFriday,
            props.disableSaturday
        ].map(expression => expression.value === true)
    });

    const minTime = props.minTime?.value;
    const maxTime = props.maxTime?.value;
    const config: PickerConfig = {
        selection,
        granularity,
        tokens,
        displayTokens,
        hasTime: withTime,
        locale,
        weekStartsOn,
        isoWeek: props.weekNumbering === "ISO",
        showWeekNumbers: props.showWeekNumbers.value === true,
        showOutsideDays: props.showOutsideDays,
        monthsToDisplay,
        showPreviousMonths: props.showPreviousMonths.value === true,
        trigger: props.triggerStyle === "BUTTON" ? "button" : props.triggerStyle === "INLINE" ? "inline" : "input",
        segmented: props.typingMode === "SEGMENTED",
        relativeTyping: props.relativeTyping,
        showIcon: props.showIcon,
        iconBeside: props.iconPosition === "BESIDE",
        icon: props.customIcon?.value ? <Icon icon={props.customIcon.value} /> : undefined,
        clearable: props.clearable.value !== false,
        readOnly,
        readOnlyAsText: props.readOnlyStyle === "TEXT",
        presets: buildPresets(props, selection, granularity, weekStartsOn, utc),
        isDayDisabled,
        rangeRules: {
            minLength: props.minRangeLength?.value ? Number(props.minRangeLength.value) : undefined,
            maxLength: props.maxRangeLength?.value ? Number(props.maxRangeLength.value) : undefined,
            excludeDisabled: props.excludeDisabledInRange
        },
        timeConstraints: {
            min: minTime ? minutesOfDay(minTime) : undefined,
            max: maxTime ? minutesOfDay(maxTime) : undefined,
            specificTimes: {
                mode: listMode(props.specificTimesMode),
                times: listDates(props, props.specificTimesSource, props.specificTimesAttribute, false).map(
                    minutesOfDay
                )
            }
        },
        timeInterval: Number(props.timeInterval.value ?? 15) || 15,
        markers: buildMarkers(props, utc),
        applyMode: props.applyMode === "ALWAYS" || (props.applyMode === "AUTO" && selection === "range"),
        closeOnSelect: props.closeOnSelect,
        rangeEndAt: props.rangeEndAt === "END" ? "end" : "start",
        openToDate: props.openToDate?.value,
        alignment: props.alignment === "RIGHT" ? "right" : props.alignment === "AUTO" ? "auto" : "left",
        showArrow: props.showArrow,
        mobileBreakpoint: props.mobileBreakpoint,
        density: props.density === "COMPACT" ? "compact" : props.density === "LARGE" ? "large" : "default",
        helpButton: props.helpButton === "BESIDE" ? "beside" : props.helpButton === "POPUP" ? "popup" : "hidden",
        customHelp: props.useCustomHelp ? props.customHelp : undefined,
        customContent: props.useCustomContent ? props.customContent : undefined,
        showTodayButton: props.showTodayButton,
        texts: buildTexts(props),
        id: props.id,
        tabIndex: props.tabIndex
    };
    return { config, utc };
}
