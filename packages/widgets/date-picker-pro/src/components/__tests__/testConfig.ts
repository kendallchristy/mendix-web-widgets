import { createDayTest, type DateConstraints } from "../../core/constraints";
import { buildLocaleInfo, intlMediumPattern } from "../../core/locale";
import { granularityOf, hasTime, tokenize } from "../../core/pattern";
import { builtInPresetIds, builtInPresetValue, presetFits } from "../../core/presets";
import { defaultTexts, type PickerConfig } from "../types";

export const enUS = buildLocaleInfo({ languageTag: "en-US", firstDayOfWeek: 1 });

/** A picker config like the one buildConfig makes, with US dates and Monday-first weeks. */
export function testConfig(
    overrides: Partial<PickerConfig> & { pattern?: string; constraints?: DateConstraints } = {}
): PickerConfig {
    const { pattern = "MM/dd/yyyy", constraints = {}, ...rest } = overrides;
    const tokens = tokenize(pattern);
    const selection = rest.selection ?? "single";
    const granularity = granularityOf(tokens);
    return {
        selection,
        granularity,
        tokens,
        displayTokens: pattern === "MM/dd/yyyy" ? tokenize(intlMediumPattern("en-US", false)) : tokens,
        hasTime: hasTime(tokens),
        locale: enUS,
        weekStartsOn: 1,
        isoWeek: false,
        showWeekNumbers: false,
        showOutsideDays: true,
        monthsToDisplay: 1,
        showPreviousMonths: false,
        trigger: "input",
        segmented: true,
        relativeTyping: true,
        showIcon: true,
        iconBeside: false,
        clearable: true,
        readOnly: false,
        readOnlyAsText: false,
        presets: builtInPresetIds
            .filter(id => presetFits(id, selection, granularity))
            .map(id => ({ id, label: id, value: builtInPresetValue(id, new Date(), 1) })),
        isDayDisabled: createDayTest(constraints),
        rangeRules: {},
        timeConstraints: {},
        timeInterval: 30,
        markers: new Map(),
        applyMode: selection === "range",
        closeOnSelect: true,
        rangeEndAt: "start",
        alignment: "left",
        showArrow: false,
        mobileBreakpoint: 0,
        density: "default",
        helpButton: "beside",
        showTodayButton: true,
        texts: defaultTexts,
        ...rest
    };
}
