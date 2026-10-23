/**
 * This file was generated from DatePickerPro.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import {
    ActionValue,
    DynamicValue,
    EditableValue,
    ListAttributeValue,
    ListExpressionValue,
    ListValue,
    WebIcon
} from "mendix";
import { ComponentType, ReactNode } from "react";
import { Big } from "big.js";

export type SelectionTypeEnum = "SINGLE" | "RANGE";

export type RangeEndAtEnum = "START" | "END";

export type DateHandlingEnum = "AUTO" | "LOCAL" | "UTC";

export type DateFormatEnum = "DATE" | "MONTH" | "QUARTER" | "YEAR" | "TIME" | "DATETIME" | "CUSTOM";

export type MonthFormatEnum = "FULL" | "ABBREVIATION" | "PADDED" | "MIN";

export type TypingModeEnum = "SEGMENTED" | "TEXT";

export type TriggerStyleEnum = "INPUT" | "BUTTON" | "INLINE";

export type IconPositionEnum = "INSIDE" | "BESIDE";

export type ReadOnlyStyleEnum = "CONTROL" | "TEXT";

export type FirstDayOfWeekEnum = "LOCALE" | "MONDAY" | "SUNDAY" | "SATURDAY";

export type WeekNumberingEnum = "LOCALE" | "ISO";

export type AlignmentEnum = "LEFT" | "RIGHT" | "AUTO";

export type DensityEnum = "COMPACT" | "DEFAULT" | "LARGE";

export type HelpButtonEnum = "BESIDE" | "POPUP" | "HIDDEN";

export interface CustomPresetsType {
    label: DynamicValue<string>;
    start?: DynamicValue<Date>;
    end?: DynamicValue<Date>;
}

export type CustomPresetsPositionEnum = "BEFORE" | "AFTER";

export type SpecificDaysModeEnum = "OFF" | "INCLUDE" | "EXCLUDE";

export type IntervalDaysModeEnum = "OFF" | "INCLUDE" | "EXCLUDE";

export type SpecificTimesModeEnum = "OFF" | "INCLUDE" | "EXCLUDE";

export type ApplyModeEnum = "AUTO" | "ALWAYS" | "NEVER";

export interface CustomPresetsPreviewType {
    label: string;
    start: string;
    end: string;
}

export interface DatePickerProContainerProps {
    name: string;
    tabIndex?: number;
    id: string;
    selectionType: SelectionTypeEnum;
    dateAttribute?: EditableValue<Date>;
    startDateAttribute?: EditableValue<Date>;
    endDateAttribute?: EditableValue<Date>;
    rangeEndAt: RangeEndAtEnum;
    dateHandling: DateHandlingEnum;
    dateFormat: DateFormatEnum;
    monthFormat: MonthFormatEnum;
    customDateFormat: DynamicValue<string>;
    timeInterval: DynamicValue<Big>;
    timeCaption: DynamicValue<string>;
    typingMode: TypingModeEnum;
    relativeTyping: boolean;
    placeholder?: DynamicValue<string>;
    endPlaceholder?: DynamicValue<string>;
    maskErrorText: DynamicValue<string>;
    includeInvalidChar: DynamicValue<boolean>;
    triggerStyle: TriggerStyleEnum;
    showIcon: boolean;
    iconPosition: IconPositionEnum;
    customIcon?: DynamicValue<WebIcon>;
    clearable: DynamicValue<boolean>;
    readOnlyStyle: ReadOnlyStyleEnum;
    monthsToDisplay: DynamicValue<Big>;
    showPreviousMonths: DynamicValue<boolean>;
    firstDayOfWeek: FirstDayOfWeekEnum;
    showWeekNumbers: DynamicValue<boolean>;
    weekNumbering: WeekNumberingEnum;
    showOutsideDays: boolean;
    showTodayButton: boolean;
    todayButtonText: DynamicValue<string>;
    alignment: AlignmentEnum;
    showArrow: boolean;
    mobileBreakpoint: number;
    density: DensityEnum;
    helpButton: HelpButtonEnum;
    useCustomHelp: boolean;
    customHelp?: ReactNode;
    showPresets: boolean;
    presetToday: boolean;
    presetYesterday: boolean;
    presetTomorrow: boolean;
    presetThisWeek: boolean;
    presetLastWeek: boolean;
    presetThisMonth: boolean;
    presetLastMonth: boolean;
    presetThisQuarter: boolean;
    presetLastQuarter: boolean;
    presetThisYear: boolean;
    presetLastYear: boolean;
    presetAllTime: boolean;
    presetTodayLabel: DynamicValue<string>;
    presetYesterdayLabel: DynamicValue<string>;
    presetTomorrowLabel: DynamicValue<string>;
    presetThisWeekLabel: DynamicValue<string>;
    presetLastWeekLabel: DynamicValue<string>;
    presetThisMonthLabel: DynamicValue<string>;
    presetLastMonthLabel: DynamicValue<string>;
    presetThisQuarterLabel: DynamicValue<string>;
    presetLastQuarterLabel: DynamicValue<string>;
    presetThisYearLabel: DynamicValue<string>;
    presetLastYearLabel: DynamicValue<string>;
    presetAllTimeLabel: DynamicValue<string>;
    customPresetLabel: DynamicValue<string>;
    customPresets: CustomPresetsType[];
    presetsSource?: ListValue;
    presetSourceLabel?: ListExpressionValue<string>;
    presetSourceStart?: ListAttributeValue<Date>;
    presetSourceEnd?: ListAttributeValue<Date>;
    customPresetsPosition: CustomPresetsPositionEnum;
    minDate?: DynamicValue<Date>;
    maxDate?: DynamicValue<Date>;
    specificDaysMode: SpecificDaysModeEnum;
    specificDaysSource?: ListValue;
    specificDaysAttribute?: ListAttributeValue<Date>;
    intervalDaysMode: IntervalDaysModeEnum;
    intervalDaysSource?: ListValue;
    intervalStartAttribute?: ListAttributeValue<Date>;
    intervalEndAttribute?: ListAttributeValue<Date>;
    disableSunday: DynamicValue<boolean>;
    disableMonday: DynamicValue<boolean>;
    disableTuesday: DynamicValue<boolean>;
    disableWednesday: DynamicValue<boolean>;
    disableThursday: DynamicValue<boolean>;
    disableFriday: DynamicValue<boolean>;
    disableSaturday: DynamicValue<boolean>;
    minRangeLength?: DynamicValue<Big>;
    maxRangeLength?: DynamicValue<Big>;
    excludeDisabledInRange: boolean;
    minTime?: DynamicValue<Date>;
    maxTime?: DynamicValue<Date>;
    specificTimesMode: SpecificTimesModeEnum;
    specificTimesSource?: ListValue;
    specificTimesAttribute?: ListAttributeValue<Date>;
    markersSource?: ListValue;
    markerDateAttribute?: ListAttributeValue<Date>;
    markerColor?: ListExpressionValue<string>;
    markerLabel?: ListExpressionValue<string>;
    applyMode: ApplyModeEnum;
    closeOnSelect: boolean;
    openToDate?: DynamicValue<Date>;
    useCustomContent: boolean;
    customContent?: ReactNode;
    closeAttribute?: EditableValue<boolean>;
    onChange?: ActionValue;
    onEnter?: ActionValue;
    onLeave?: ActionValue;
    required: DynamicValue<boolean>;
    requiredMessage: DynamicValue<string>;
    invalidDateMessage: DynamicValue<string>;
    rangeTooShortMessage: DynamicValue<string>;
    rangeTooLongMessage: DynamicValue<string>;
    rangeCrossesDisabledMessage: DynamicValue<string>;
    calendarIconLabel: DynamicValue<string>;
    navigateButtonPrefix: DynamicValue<string>;
    selectPrefix: DynamicValue<string>;
    weekPrefix: DynamicValue<string>;
    monthPrefix: DynamicValue<string>;
    monthSelectLabel: DynamicValue<string>;
    yearSelectLabel: DynamicValue<string>;
    disabledLabel: DynamicValue<string>;
    clearButtonLabel: DynamicValue<string>;
    startLabel: DynamicValue<string>;
    endLabel: DynamicValue<string>;
    applyLabel: DynamicValue<string>;
    cancelLabel: DynamicValue<string>;
    presetsLabel: DynamicValue<string>;
    helpLabel: DynamicValue<string>;
}

export interface DatePickerProPreviewProps {
    readOnly: boolean;
    renderMode: "design" | "xray" | "structure";
    translate: (text: string) => string;
    selectionType: SelectionTypeEnum;
    dateAttribute: string;
    startDateAttribute: string;
    endDateAttribute: string;
    rangeEndAt: RangeEndAtEnum;
    dateHandling: DateHandlingEnum;
    dateFormat: DateFormatEnum;
    monthFormat: MonthFormatEnum;
    customDateFormat: string;
    timeInterval: string;
    timeCaption: string;
    typingMode: TypingModeEnum;
    relativeTyping: boolean;
    placeholder: string;
    endPlaceholder: string;
    maskErrorText: string;
    includeInvalidChar: string;
    triggerStyle: TriggerStyleEnum;
    showIcon: boolean;
    iconPosition: IconPositionEnum;
    customIcon:
        | { type: "glyph"; iconClass: string }
        | { type: "image"; imageUrl: string; iconUrl: string }
        | { type: "icon"; iconClass: string }
        | undefined;
    clearable: string;
    readOnlyStyle: ReadOnlyStyleEnum;
    monthsToDisplay: string;
    showPreviousMonths: string;
    firstDayOfWeek: FirstDayOfWeekEnum;
    showWeekNumbers: string;
    weekNumbering: WeekNumberingEnum;
    showOutsideDays: boolean;
    showTodayButton: boolean;
    todayButtonText: string;
    alignment: AlignmentEnum;
    showArrow: boolean;
    mobileBreakpoint: number | null;
    density: DensityEnum;
    helpButton: HelpButtonEnum;
    useCustomHelp: boolean;
    customHelp: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    showPresets: boolean;
    presetToday: boolean;
    presetYesterday: boolean;
    presetTomorrow: boolean;
    presetThisWeek: boolean;
    presetLastWeek: boolean;
    presetThisMonth: boolean;
    presetLastMonth: boolean;
    presetThisQuarter: boolean;
    presetLastQuarter: boolean;
    presetThisYear: boolean;
    presetLastYear: boolean;
    presetAllTime: boolean;
    presetTodayLabel: string;
    presetYesterdayLabel: string;
    presetTomorrowLabel: string;
    presetThisWeekLabel: string;
    presetLastWeekLabel: string;
    presetThisMonthLabel: string;
    presetLastMonthLabel: string;
    presetThisQuarterLabel: string;
    presetLastQuarterLabel: string;
    presetThisYearLabel: string;
    presetLastYearLabel: string;
    presetAllTimeLabel: string;
    customPresetLabel: string;
    customPresets: CustomPresetsPreviewType[];
    presetsSource: {} | { caption: string } | { type: string } | null;
    presetSourceLabel: string;
    presetSourceStart: string;
    presetSourceEnd: string;
    customPresetsPosition: CustomPresetsPositionEnum;
    minDate: string;
    maxDate: string;
    specificDaysMode: SpecificDaysModeEnum;
    specificDaysSource: {} | { caption: string } | { type: string } | null;
    specificDaysAttribute: string;
    intervalDaysMode: IntervalDaysModeEnum;
    intervalDaysSource: {} | { caption: string } | { type: string } | null;
    intervalStartAttribute: string;
    intervalEndAttribute: string;
    disableSunday: string;
    disableMonday: string;
    disableTuesday: string;
    disableWednesday: string;
    disableThursday: string;
    disableFriday: string;
    disableSaturday: string;
    minRangeLength: string;
    maxRangeLength: string;
    excludeDisabledInRange: boolean;
    minTime: string;
    maxTime: string;
    specificTimesMode: SpecificTimesModeEnum;
    specificTimesSource: {} | { caption: string } | { type: string } | null;
    specificTimesAttribute: string;
    markersSource: {} | { caption: string } | { type: string } | null;
    markerDateAttribute: string;
    markerColor: string;
    markerLabel: string;
    applyMode: ApplyModeEnum;
    closeOnSelect: boolean;
    openToDate: string;
    useCustomContent: boolean;
    customContent: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    closeAttribute: string;
    onChange: {} | null;
    onEnter: {} | null;
    onLeave: {} | null;
    required: string;
    requiredMessage: string;
    invalidDateMessage: string;
    rangeTooShortMessage: string;
    rangeTooLongMessage: string;
    rangeCrossesDisabledMessage: string;
    calendarIconLabel: string;
    navigateButtonPrefix: string;
    selectPrefix: string;
    weekPrefix: string;
    monthPrefix: string;
    monthSelectLabel: string;
    yearSelectLabel: string;
    disabledLabel: string;
    clearButtonLabel: string;
    startLabel: string;
    endLabel: string;
    applyLabel: string;
    cancelLabel: string;
    presetsLabel: string;
    helpLabel: string;
}
