import type { ReactNode } from "react";

import type { DayTest, RangeRules, TimeConstraints } from "../core/constraints";
import type { LocaleInfo, WeekDay } from "../core/locale";
import type { Token } from "../core/pattern";
import type { Preset } from "../core/presets";
import type { Granularity, SelectionType } from "../core/types";
import type { RangeEndAt } from "../core/value";

export interface Marker {
    color?: string;
    label?: string;
}

/** Every user-facing text, so all of them can be translated in Studio Pro. */
export interface PickerTexts {
    placeholder: string;
    endPlaceholder: string;
    timeCaption: string;
    todayButton: string;
    customPreset: string;
    maskError: string;
    includeInvalidChar: boolean;
    requiredMessage: string;
    invalidDate: string;
    rangeTooShort: string;
    rangeTooLong: string;
    rangeCrossesDisabled: string;
    calendarButton: string;
    navigatePrefix: string;
    selectPrefix: string;
    weekPrefix: string;
    monthPrefix: string;
    monthSelect: string;
    yearSelect: string;
    disabled: string;
    clear: string;
    start: string;
    end: string;
    apply: string;
    cancel: string;
    presets: string;
    help: string;
}

export const defaultTexts: PickerTexts = {
    placeholder: "",
    endPlaceholder: "",
    timeCaption: "Time",
    todayButton: "Today",
    customPreset: "Custom",
    maskError: "That character can't go there.",
    includeInvalidChar: true,
    requiredMessage: "Choose a date.",
    invalidDate: "That isn't a date that can be picked.",
    rangeTooShort: "Choose a longer range (at least [count]).",
    rangeTooLong: "Choose a shorter range (at most [count]).",
    rangeCrossesDisabled: "The range can't include days that are unavailable.",
    calendarButton: "Toggle calendar",
    navigatePrefix: "Show",
    selectPrefix: "Select",
    weekPrefix: "Week",
    monthPrefix: "Month",
    monthSelect: "Select month",
    yearSelect: "Select year",
    disabled: "Not selectable",
    clear: "Clear",
    start: "Start date",
    end: "End date",
    apply: "Apply",
    cancel: "Cancel",
    presets: "Presets",
    help: "Typing and keyboard shortcuts"
};

export type TriggerStyle = "input" | "button" | "inline";

export interface PickerConfig {
    selection: SelectionType;
    granularity: Granularity;
    /** Tokens of the format used to show and type dates. */
    tokens: Token[];
    /** Tokens for the button trigger, which uses a friendlier medium format for plain dates. */
    displayTokens: Token[];
    hasTime: boolean;
    locale: LocaleInfo;
    weekStartsOn: WeekDay;
    isoWeek: boolean;
    showWeekNumbers: boolean;
    showOutsideDays: boolean;
    monthsToDisplay: number;
    showPreviousMonths: boolean;
    trigger: TriggerStyle;
    segmented: boolean;
    relativeTyping: boolean;
    showIcon: boolean;
    iconBeside: boolean;
    icon?: ReactNode;
    clearable: boolean;
    readOnly: boolean;
    readOnlyAsText: boolean;
    presets: Preset[];
    isDayDisabled: DayTest;
    rangeRules: RangeRules;
    timeConstraints: TimeConstraints;
    timeInterval: number;
    markers: Map<string, Marker[]>;
    applyMode: boolean;
    closeOnSelect: boolean;
    rangeEndAt: RangeEndAt;
    openToDate?: Date;
    alignment: "left" | "right" | "auto";
    showArrow: boolean;
    mobileBreakpoint: number;
    density: "compact" | "default" | "large";
    helpButton: "beside" | "popup" | "hidden";
    customHelp?: ReactNode;
    customContent?: ReactNode;
    showTodayButton: boolean;
    texts: PickerTexts;
    /** The id Mendix gives the widget for its label. */
    id?: string;
    tabIndex?: number;
}
