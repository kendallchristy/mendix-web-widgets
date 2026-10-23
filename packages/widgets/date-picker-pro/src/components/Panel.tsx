// The popup's content (or the inline calendar): presets, calendars, time list, typed fields and buttons.
import classNames from "classnames";
import { startOfMonth } from "date-fns";
import { useId, useMemo, type KeyboardEvent, type ReactElement } from "react";

import { createPendingEndTest, isPeriodDisabled, minutesOfDay, timeOptions } from "../core/constraints";
import { tokenize, type Token } from "../core/pattern";
import { unitOf } from "../core/periods";
import { findActivePreset } from "../core/presets";
import { shortcutSections } from "../core/shortcuts";
import type { Edge } from "../core/types";
import { DayCalendar } from "./DayCalendar";
import { HelpContent } from "./HelpContent";
import { HelpIcon } from "./Icons";
import { PeriodGrid, type GridUnit } from "./PeriodGrid";
import { PresetList } from "./PresetList";
import { SegmentedField } from "./SegmentedField";
import { TextField } from "./TextField";
import { TimeList } from "./TimeList";
import type { PickerConfig } from "./types";
import type { PickerActions, PickerState } from "./usePickerState";

export interface PanelProps {
    config: PickerConfig;
    state: PickerState;
    actions: PickerActions;
    numberOfMonths: number;
    mobile: boolean;
    autoFocus: boolean;
    /** Show start/end fields in the footer. */
    showFields: boolean;
    labelledBy?: string;
    typingExample?: { typed: string; shown: string };
}

/** Time tokens of a pattern for the time list ("HH:mm" from "dd-MM-yyyy HH:mm"), or the user's time format. */
function timeTokens(tokens: Token[], fallback: Token[]): Token[] {
    const first = tokens.findIndex(
        token => token.kind === "segment" && ["hour", "minute", "second", "dayPeriod"].includes(token.type)
    );
    if (first < 0) {
        return fallback;
    }
    const lastSegment = [...tokens]
        .reverse()
        .find(
            token =>
                token.kind === "segment" &&
                ["hour", "minute", "second", "millisecond", "dayPeriod"].includes(token.type)
        );
    const last = lastSegment ? tokens.lastIndexOf(lastSegment) : tokens.length - 1;
    return tokens.slice(first, last + 1).filter(token => !(token.kind === "segment" && token.type === "millisecond"));
}

export function Panel(props: PanelProps): ReactElement {
    const { config, state, actions, numberOfMonths, mobile } = props;
    const { selection, granularity, texts, locale, presets } = config;
    const { draft, pending, hover, month, view } = state;
    const unit = unitOf(granularity);
    const helpTitleId = useId();

    const { isDayDisabled: baseDisabled, rangeRules } = config;
    const pendingStart = selection === "range" && pending ? draft.start : undefined;

    // While a range end is being picked, also block the days that can't end it.
    const isDayDisabled = useMemo(() => {
        if (!pendingStart) {
            return baseDisabled;
        }
        const blocked = createPendingEndTest(pendingStart, "day", rangeRules, baseDisabled);
        return (day: Date) => baseDisabled(day) || blocked(day);
    }, [baseDisabled, rangeRules, pendingStart]);

    const blockedEnds =
        pendingStart && unit !== "day" ? createPendingEndTest(pendingStart, unit, rangeRules, baseDisabled) : undefined;
    const isPeriodBlocked = (period: Date): boolean =>
        isPeriodDisabled(period, unit, baseDisabled) || !!blockedEnds?.(period);

    const activePreset = findActivePreset(presets, draft, selection, granularity);
    const showPresets = presets.length > 0 && granularity !== "time" && view !== "help";
    const fallbackTime = useMemo(() => tokenize(locale.patterns.time), [locale]);
    const timeTokenList = timeTokens(config.tokens, fallbackTime);

    const handlePanelKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
        const target = event.target as HTMLElement;
        const typing = target.isContentEditable || target.tagName === "INPUT";
        if (event.key === "?" && !typing && config.helpButton !== "hidden") {
            event.preventDefault();
            actions.setView(view === "help" ? "calendar" : "help");
        }
    };

    const fieldFor = (edge: Edge, label: string): ReactElement => {
        const Field = config.segmented ? SegmentedField : TextField;
        return (
            <Field
                key={edge}
                tokens={config.tokens}
                locale={locale}
                value={draft[edge]}
                reference={draft[edge] ?? (edge === "end" ? draft.start : undefined)}
                label={label}
                labelledBy={selection === "single" ? props.labelledBy : undefined}
                className="dpp-panel__field"
                placeholder={edge === "end" ? texts.endPlaceholder : texts.placeholder}
                clearable={config.clearable}
                typing={{
                    tokens: config.tokens,
                    locale,
                    weekStartsOn: config.weekStartsOn,
                    relativeTyping: config.relativeTyping
                }}
                messages={{
                    invalidDate: texts.invalidDate,
                    disabled: texts.disabled,
                    maskError: texts.maskError,
                    includeInvalidChar: texts.includeInvalidChar
                }}
                isDisabled={granularity === "time" ? undefined : config.isDayDisabled}
                onChange={date => actions.setDraftEdge(edge, date)}
                onTyped={result => actions.applyTyped(result, edge)}
                onMessage={actions.setMessage}
            />
        );
    };

    const renderCalendar = (): ReactElement | null => {
        if (granularity === "time") {
            return null;
        }
        if (view === "months" || view === "years") {
            const jumpUnit: GridUnit = view === "months" ? "month" : "year";
            return (
                <PeriodGrid
                    unit={jumpUnit}
                    page={month}
                    onPageChange={page =>
                        actions.setMonth(startOfMonth(new Date(page.getFullYear(), month.getMonth(), 1)))
                    }
                    onPick={period => {
                        if (view === "years") {
                            actions.setMonth(new Date(period.getFullYear(), month.getMonth(), 1));
                            actions.setView(
                                granularity === "year" ? "calendar" : unit === "day" ? "months" : "calendar"
                            );
                        } else {
                            actions.setMonth(period);
                            actions.setView("calendar");
                        }
                    }}
                    start={month}
                    isDisabled={() => false}
                    onTitleClick={view === "months" ? () => actions.setView("years") : undefined}
                    locale={locale}
                    texts={texts}
                    autoFocus
                />
            );
        }
        if (unit === "day") {
            return (
                <DayCalendar
                    selection={selection}
                    value={draft}
                    pending={pending}
                    hover={hover}
                    month={month}
                    numberOfMonths={numberOfMonths}
                    onMonthChange={actions.setMonth}
                    onPick={actions.pickDay}
                    onHover={actions.setHover}
                    onCaptionClick={date => {
                        actions.setMonth(date);
                        actions.setView("months");
                    }}
                    isDisabled={isDayDisabled}
                    markers={config.markers}
                    locale={locale}
                    weekStartsOn={config.weekStartsOn}
                    isoWeek={config.isoWeek}
                    showWeekNumbers={config.showWeekNumbers}
                    showOutsideDays={config.showOutsideDays}
                    autoFocus={props.autoFocus}
                    texts={texts}
                />
            );
        }
        return (
            <PeriodGrid
                unit={unit as GridUnit}
                page={month}
                onPageChange={actions.setMonth}
                onPick={actions.pickDay}
                onHover={actions.setHover}
                start={draft.start}
                end={selection === "range" ? draft.end : undefined}
                pending={pending}
                hover={hover}
                isDisabled={isPeriodBlocked}
                onTitleClick={unit === "year" ? undefined : () => actions.setView("years")}
                locale={locale}
                texts={texts}
                autoFocus={props.autoFocus}
            />
        );
    };

    const timeEdge: Edge = selection === "single" ? "start" : state.timeEdge;
    const timeValue = draft[timeEdge];
    const timeList = config.hasTime ? (
        <TimeList
            options={timeOptions(config.timeInterval, config.timeConstraints)}
            selected={timeValue ? minutesOfDay(timeValue) : undefined}
            onPick={actions.pickTime}
            caption={texts.timeCaption}
            tokens={timeTokenList}
            locale={locale}
            edgeSwitch={
                selection === "range" ? (
                    <div className="dpp-time__edges" role="group">
                        {(["start", "end"] as const).map(edge => (
                            <button
                                key={edge}
                                type="button"
                                className={classNames("dpp-time__edge", {
                                    "dpp-time__edge--active": timeEdge === edge
                                })}
                                aria-pressed={timeEdge === edge}
                                onClick={() => actions.setTimeEdge(edge)}
                            >
                                {edge === "start" ? texts.start : texts.end}
                            </button>
                        ))}
                    </div>
                ) : undefined
            }
        />
    ) : null;

    const showHelpButton = config.helpButton !== "hidden";
    // "Today" means nothing to a time-only picker.
    const showTodayButton = config.showTodayButton && granularity !== "time";
    const showFooter = props.showFields || config.applyMode || showTodayButton || showHelpButton;

    return (
        <div
            className={classNames("dpp-panel", `dpp-panel--${config.density}`, {
                "dpp-panel--mobile": mobile,
                "dpp-panel--with-presets": showPresets
            })}
            onKeyDown={handlePanelKeyDown}
        >
            {showPresets ? (
                <PresetList
                    presets={presets}
                    activeId={activePreset?.id}
                    custom={!activePreset && !!(draft.start || draft.end)}
                    customLabel={selection === "range" ? texts.customPreset : ""}
                    label={texts.presets}
                    compact={mobile}
                    onPick={actions.pickPreset}
                />
            ) : null}
            <div className="dpp-panel__main">
                {view === "help" ? (
                    <div className="dpp-panel__help" role="region" aria-labelledby={helpTitleId}>
                        <HelpContent
                            title={texts.help}
                            titleId={helpTitleId}
                            custom={config.customHelp}
                            sections={shortcutSections({
                                selection,
                                granularity,
                                hasTime: config.hasTime,
                                relativeTyping: config.relativeTyping,
                                segmented: config.segmented,
                                inline: config.trigger === "inline",
                                typingExample: props.typingExample
                            })}
                        />
                    </div>
                ) : (
                    <div
                        className={classNames("dpp-panel__calendars", {
                            "dpp-panel__calendars--time-only": granularity === "time"
                        })}
                    >
                        {renderCalendar()}
                        {timeList}
                    </div>
                )}
                {config.customContent ? <div className="dpp-panel__custom">{config.customContent}</div> : null}
                {showFooter ? (
                    <div className="dpp-panel__footer">
                        {props.showFields ? (
                            <div className="dpp-panel__fields">
                                {fieldFor("start", texts.start)}
                                {selection === "range" ? (
                                    <>
                                        <span className="dpp-panel__dash" aria-hidden>
                                            –
                                        </span>
                                        {fieldFor("end", texts.end)}
                                    </>
                                ) : null}
                            </div>
                        ) : null}
                        <div className="dpp-panel__actions">
                            {showHelpButton ? (
                                <button
                                    type="button"
                                    className={classNames("dpp-icon-button dpp-panel__help-button", {
                                        "dpp-icon-button--active": view === "help"
                                    })}
                                    aria-label={texts.help}
                                    aria-expanded={view === "help"}
                                    title={texts.help}
                                    onClick={() => actions.setView(view === "help" ? "calendar" : "help")}
                                >
                                    <HelpIcon />
                                </button>
                            ) : null}
                            {showTodayButton ? (
                                <button type="button" className="dpp-button-secondary" onClick={actions.goToToday}>
                                    {texts.todayButton}
                                </button>
                            ) : null}
                            {config.applyMode ? (
                                <>
                                    <button type="button" className="dpp-button-secondary" onClick={actions.close}>
                                        {texts.cancel}
                                    </button>
                                    <button type="button" className="dpp-button-primary" onClick={actions.apply}>
                                        {texts.apply}
                                    </button>
                                </>
                            ) : null}
                        </div>
                    </div>
                ) : null}
                <div className="dpp-panel__message" role="status" aria-live="polite">
                    {state.message}
                </div>
            </div>
        </div>
    );
}
