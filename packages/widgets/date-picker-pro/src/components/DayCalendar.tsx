// The day grid: react-day-picker with our own captions (arrows on every month, as in the design), range and
// hover-preview styling, and event markers under the days.
import classNames from "classnames";
import { addMonths, isSameDay, startOfDay, startOfMonth } from "date-fns";
import { createContext, useContext, useEffect, useRef, type ReactElement } from "react";
import {
    DayPicker,
    type CustomComponents,
    type DayButtonProps,
    type DayProps,
    type Matcher,
    type MonthCaptionProps
} from "react-day-picker";

import type { LocaleInfo, WeekDay } from "../core/locale";
import { dayKey } from "../core/periods";
import type { PickerValue, SelectionType } from "../core/types";
import { ChevronIcon } from "./Icons";
import type { Marker, PickerTexts } from "./types";

export interface DayCalendarProps {
    selection: SelectionType;
    value: PickerValue;
    /** Range start picked, end not yet. */
    pending: boolean;
    hover?: Date;
    month: Date;
    numberOfMonths: number;
    onMonthChange: (month: Date) => void;
    onPick: (day: Date) => void;
    onHover: (day: Date | undefined) => void;
    onCaptionClick: (month: Date) => void;
    isDisabled: (day: Date) => boolean;
    min?: Date;
    max?: Date;
    markers: Map<string, Marker[]>;
    locale: LocaleInfo;
    weekStartsOn: WeekDay;
    isoWeek: boolean;
    showWeekNumbers: boolean;
    showOutsideDays: boolean;
    autoFocus: boolean;
    texts: PickerTexts;
}

interface CalendarContextValue {
    markers: Map<string, Marker[]>;
    locale: LocaleInfo;
    texts: PickerTexts;
    numberOfMonths: number;
    canPrevious: boolean;
    canNext: boolean;
    onPrevious: () => void;
    onNext: () => void;
    onCaptionClick: (month: Date) => void;
}

const CalendarContext = createContext<CalendarContextValue | undefined>(undefined);

function useCalendarContext(): CalendarContextValue {
    return useContext(CalendarContext)!;
}

const MAX_DOTS = 3;

const rangeClasses =
    /\bdpp-day--(selected|range-start|range-middle|range-end|preview-start|preview-end|preview)(?=\s|$)/g;

/** With several months side by side, a range shows once: outside days don't repeat the neighbouring month's band. */
function Day(props: DayProps): ReactElement {
    const { day, modifiers: _modifiers, className, ...cellProps } = props;
    const { numberOfMonths } = useCalendarContext();
    const plain = day.outside && numberOfMonths > 1;
    return <td {...cellProps} className={plain ? className?.replace(rangeClasses, "").trim() : className} />;
}

function DayButton(props: DayButtonProps): ReactElement {
    const { day, modifiers, children, className, ...buttonProps } = props;
    const { markers } = useCalendarContext();
    const dayMarkers = modifiers.outside ? undefined : markers.get(dayKey(day.date));
    const ref = useRef<HTMLButtonElement>(null);
    // react-day-picker's own DayButton moves focus to the focused day; ours must keep doing that.
    useEffect(() => {
        if (modifiers.focused) {
            ref.current?.focus();
        }
    }, [modifiers.focused]);
    return (
        <button
            ref={ref}
            {...buttonProps}
            className={classNames(className, {
                "dpp-day--marked": !!dayMarkers?.length
            })}
            title={
                dayMarkers
                    ?.map(marker => marker.label)
                    .filter(Boolean)
                    .join("\n") || undefined
            }
        >
            <span className="dpp-day__number">{children}</span>
            {dayMarkers?.length ? (
                <span className="dpp-day__markers" aria-hidden>
                    {dayMarkers.slice(0, MAX_DOTS).map((marker, index) => (
                        <span
                            key={index}
                            className="dpp-day__marker"
                            style={marker.color ? { backgroundColor: marker.color } : undefined}
                        />
                    ))}
                    {dayMarkers.length > MAX_DOTS ? (
                        <span className="dpp-day__marker-count">+{dayMarkers.length - MAX_DOTS}</span>
                    ) : null}
                </span>
            ) : null}
        </button>
    );
}

function MonthCaption(props: MonthCaptionProps): ReactElement {
    const { calendarMonth, displayIndex: _displayIndex, className, ...divProps } = props;
    const { locale, texts, canPrevious, canNext, onPrevious, onNext, onCaptionClick } = useCalendarContext();
    const date = calendarMonth.date;
    const title = `${locale.monthsLong[date.getMonth()]} ${date.getFullYear()}`;
    return (
        <div {...divProps} className={classNames(className, "dpp-caption")}>
            <button
                type="button"
                className="dpp-nav-button"
                aria-label={`${texts.navigatePrefix} ${previousLabel(date, locale)}`}
                disabled={!canPrevious}
                onClick={onPrevious}
            >
                <ChevronIcon direction="left" />
            </button>
            <button
                type="button"
                className="dpp-caption__title"
                aria-label={`${texts.monthSelect}: ${title}`}
                aria-live="polite"
                onClick={() => onCaptionClick(date)}
            >
                {title}
            </button>
            <button
                type="button"
                className="dpp-nav-button"
                aria-label={`${texts.navigatePrefix} ${nextLabel(date, locale)}`}
                disabled={!canNext}
                onClick={onNext}
            >
                <ChevronIcon direction="right" />
            </button>
        </div>
    );
}

function previousLabel(date: Date, locale: LocaleInfo): string {
    const previous = addMonths(date, -1);
    return `${locale.monthsLong[previous.getMonth()]} ${previous.getFullYear()}`;
}

function nextLabel(date: Date, locale: LocaleInfo): string {
    const next = addMonths(date, 1);
    return `${locale.monthsLong[next.getMonth()]} ${next.getFullYear()}`;
}

const components: Partial<CustomComponents> = { Day, DayButton, MonthCaption };

export function DayCalendar(props: DayCalendarProps): ReactElement {
    const { value, pending, hover, month, numberOfMonths, locale, texts, markers } = props;
    const start = value.start ? startOfDay(value.start) : undefined;
    const end = value.end ? startOfDay(value.end) : undefined;

    const modifiers = ((): Record<string, Matcher | Matcher[] | undefined> => {
        const result: Record<string, Matcher | Matcher[] | undefined> = {};
        if (props.selection === "single" || pending || !end) {
            result.selected = start;
            if (start && props.selection === "range") {
                result.range_start = start;
                result.range_end = !pending && !end ? start : undefined;
            }
        } else if (start && end) {
            result.selected = { from: start, to: end };
            result.range_start = start;
            result.range_end = end;
            result.range_middle = (day: Date) => day > start && day < end;
        }
        if (pending && start && hover && !isSameDay(start, hover)) {
            const [from, to] = hover < start ? [startOfDay(hover), start] : [start, startOfDay(hover)];
            result.preview = { from, to };
            result.preview_start = from;
            result.preview_end = to;
        }
        return result;
    })();

    const startMonth = props.min ? startOfMonth(props.min) : undefined;
    const endMonth = props.max ? startOfMonth(props.max) : undefined;
    const lastShown = addMonths(month, numberOfMonths - 1);
    const context: CalendarContextValue = {
        markers,
        locale,
        texts,
        numberOfMonths,
        canPrevious: !startMonth || month > startMonth,
        canNext: !endMonth || lastShown < endMonth,
        onPrevious: () => props.onMonthChange(addMonths(month, -1)),
        onNext: () => props.onMonthChange(addMonths(month, 1)),
        onCaptionClick: props.onCaptionClick
    };

    const fullDate = (date: Date): string =>
        new Intl.DateTimeFormat(locale.languageTag, {
            dateStyle: "full"
        }).format(date);

    return (
        <CalendarContext.Provider value={context}>
            <DayPicker
                className="dpp-calendar"
                classNames={{
                    months: "dpp-months",
                    month: "dpp-month",
                    month_caption: "dpp-month-caption",
                    month_grid: "dpp-grid",
                    weekdays: "dpp-weekdays",
                    weekday: "dpp-weekday",
                    week: "dpp-week",
                    week_number: "dpp-week-number",
                    week_number_header: "dpp-week-number-header",
                    day: "dpp-day",
                    day_button: "dpp-day__button",
                    today: "dpp-day--today",
                    outside: "dpp-day--outside",
                    disabled: "dpp-day--disabled",
                    selected: "dpp-day--selected",
                    range_start: "dpp-day--range-start",
                    range_middle: "dpp-day--range-middle",
                    range_end: "dpp-day--range-end",
                    focused: "dpp-day--focused",
                    hidden: "dpp-day--hidden"
                }}
                modifiersClassNames={{
                    preview: "dpp-day--preview",
                    preview_start: "dpp-day--preview-start",
                    preview_end: "dpp-day--preview-end"
                }}
                components={components}
                hideNavigation
                month={month}
                onMonthChange={props.onMonthChange}
                numberOfMonths={numberOfMonths}
                startMonth={startMonth}
                endMonth={endMonth}
                weekStartsOn={props.weekStartsOn}
                ISOWeek={props.isoWeek}
                showWeekNumber={props.showWeekNumbers}
                showOutsideDays={props.showOutsideDays}
                fixedWeeks={numberOfMonths > 1}
                autoFocus={props.autoFocus}
                disabled={props.isDisabled}
                modifiers={modifiers}
                lang={locale.languageTag}
                onDayClick={(day, dayModifiers) => {
                    if (!dayModifiers.disabled) {
                        props.onPick(day);
                    }
                }}
                onDayMouseEnter={day => props.onHover(day)}
                onDayFocus={day => props.onHover(day)}
                onDayMouseLeave={() => props.onHover(undefined)}
                formatters={{
                    formatCaption: date => `${locale.monthsLong[date.getMonth()]} ${date.getFullYear()}`,
                    formatWeekdayName: date => locale.weekdaysShort[date.getDay()].slice(0, 2)
                }}
                labels={{
                    labelGrid: date => `${locale.monthsLong[date.getMonth()]} ${date.getFullYear()}`,
                    labelWeekday: date => locale.weekdaysLong[date.getDay()],
                    labelWeekNumber: weekNumber => `${texts.weekPrefix} ${weekNumber}`,
                    labelWeekNumberHeader: () => texts.weekPrefix,
                    labelDayButton: (date, dayModifiers) => {
                        const dayMarkers = dayModifiers.outside ? undefined : markers.get(dayKey(date));
                        const extras = [
                            dayModifiers.today ? "today" : "",
                            dayModifiers.selected ? "selected" : "",
                            dayModifiers.disabled ? texts.disabled : "",
                            dayMarkers?.length
                                ? dayMarkers
                                      .map(marker => marker.label)
                                      .filter(Boolean)
                                      .join(", ") || `${dayMarkers.length}`
                                : ""
                        ].filter(Boolean);
                        return [`${texts.selectPrefix} ${fullDate(date)}`, ...extras].join(", ");
                    }
                }}
            />
        </CalendarContext.Provider>
    );
}
