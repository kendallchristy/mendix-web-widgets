// Month, quarter and year grids: the pickers for those formats, and the month/year jump from the day calendar.
import classNames from "classnames";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactElement } from "react";

import type { LocaleInfo } from "../core/locale";
import { periodDifference, samePeriod, startOfPeriod } from "../core/periods";
import { ChevronIcon } from "./Icons";
import type { PickerTexts } from "./types";

export type GridUnit = "month" | "quarter" | "year";

const YEARS_PER_PAGE = 12;

export interface PeriodGridProps {
    unit: GridUnit;
    /** Any date in the page shown: its year for months and quarters, its 12-year page for years. */
    page: Date;
    onPageChange: (page: Date) => void;
    onPick: (period: Date) => void;
    onHover?: (period: Date | undefined) => void;
    /** Selected period, or the ends of the range. */
    start?: Date;
    end?: Date;
    pending?: boolean;
    hover?: Date;
    isDisabled: (period: Date) => boolean;
    /** Clicking the title, for moving from months up to years. */
    onTitleClick?: () => void;
    locale: LocaleInfo;
    texts: PickerTexts;
    autoFocus?: boolean;
}

export function pageStart(date: Date, unit: GridUnit): Date {
    if (unit === "year") {
        return new Date(
            date.getFullYear() - (((date.getFullYear() % YEARS_PER_PAGE) + YEARS_PER_PAGE) % YEARS_PER_PAGE),
            0,
            1
        );
    }
    return new Date(date.getFullYear(), 0, 1);
}

function periodsOf(page: Date, unit: GridUnit): Date[] {
    const first = pageStart(page, unit);
    switch (unit) {
        case "month":
            return Array.from({ length: 12 }, (_, i) => new Date(first.getFullYear(), i, 1));
        case "quarter":
            return Array.from({ length: 4 }, (_, i) => new Date(first.getFullYear(), i * 3, 1));
        case "year":
            return Array.from({ length: YEARS_PER_PAGE }, (_, i) => new Date(first.getFullYear() + i, 0, 1));
    }
}

const columns: Record<GridUnit, number> = { month: 3, quarter: 4, year: 3 };

function labelOf(period: Date, unit: GridUnit, locale: LocaleInfo): { short: string; long: string } {
    switch (unit) {
        case "month":
            return {
                short: locale.monthsShort[period.getMonth()],
                long: `${locale.monthsLong[period.getMonth()]} ${period.getFullYear()}`
            };
        case "quarter": {
            const quarter = `Q${Math.floor(period.getMonth() / 3) + 1}`;
            return {
                short: quarter,
                long: `${quarter} ${period.getFullYear()}`
            };
        }
        case "year":
            return {
                short: String(period.getFullYear()),
                long: String(period.getFullYear())
            };
    }
}

export function PeriodGrid(props: PeriodGridProps): ReactElement {
    const { unit, page, locale, texts, start, end, pending, hover } = props;
    const periods = periodsOf(page, unit);
    const first = periods[0];
    const last = periods[periods.length - 1];
    const cols = columns[unit];
    const [today] = useState(() => new Date());

    const initialFocus = (): number => {
        const target = start ?? today;
        const index = periods.findIndex(p => samePeriod(p, target, unit));
        return index >= 0 ? index : 0;
    };
    const [focusIndex, setFocusIndex] = useState(initialFocus);
    const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);
    const shouldFocusRef = useRef(!!props.autoFocus);

    useEffect(() => {
        if (shouldFocusRef.current) {
            buttonsRef.current[focusIndex]?.focus();
            shouldFocusRef.current = false;
        }
    });

    const shift = (pages: number): void => {
        const years = unit === "year" ? YEARS_PER_PAGE * pages : pages;
        props.onPageChange(new Date(first.getFullYear() + years, 0, 1));
    };

    const moveFocus = (index: number): void => {
        shouldFocusRef.current = true;
        if (index < 0) {
            shift(-1);
            setFocusIndex(periods.length + index);
        } else if (index >= periods.length) {
            shift(1);
            setFocusIndex(index - periods.length);
        } else {
            setFocusIndex(index);
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
        const moves: Record<string, number> = {
            ArrowLeft: -1,
            ArrowRight: 1,
            ArrowUp: -cols,
            ArrowDown: cols
        };
        if (event.key in moves) {
            event.preventDefault();
            moveFocus(index + moves[event.key]);
        } else if (event.key === "PageUp" || event.key === "PageDown") {
            event.preventDefault();
            shouldFocusRef.current = true;
            shift(event.key === "PageUp" ? -1 : 1);
        } else if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            moveFocus(event.key === "Home" ? 0 : periods.length - 1);
        }
    };

    const [from, to] = (() => {
        if (pending && start && hover) {
            return hover < start ? [hover, start] : [start, hover];
        }
        return [start, end];
    })();
    const rangeShown = !!(from && to);

    const title = unit === "year" ? `${first.getFullYear()} – ${last.getFullYear()}` : String(first.getFullYear());
    const rows: Date[][] = [];
    for (let i = 0; i < periods.length; i += cols) {
        rows.push(periods.slice(i, i + cols));
    }

    return (
        <div className={classNames("dpp-periods", `dpp-periods--${unit}`)}>
            <div className="dpp-caption">
                <button
                    type="button"
                    className="dpp-nav-button"
                    aria-label={`${texts.navigatePrefix} ${
                        unit === "year"
                            ? `${first.getFullYear() - YEARS_PER_PAGE} – ${first.getFullYear() - 1}`
                            : first.getFullYear() - 1
                    }`}
                    onClick={() => shift(-1)}
                >
                    <ChevronIcon direction="left" />
                </button>
                {props.onTitleClick ? (
                    <button
                        type="button"
                        className="dpp-caption__title"
                        aria-label={`${texts.yearSelect}: ${title}`}
                        onClick={props.onTitleClick}
                    >
                        {title}
                    </button>
                ) : (
                    <span className="dpp-caption__title dpp-caption__title--static" aria-live="polite">
                        {title}
                    </span>
                )}
                <button
                    type="button"
                    className="dpp-nav-button"
                    aria-label={`${texts.navigatePrefix} ${
                        unit === "year"
                            ? `${last.getFullYear() + 1} – ${last.getFullYear() + YEARS_PER_PAGE}`
                            : last.getFullYear() + 1
                    }`}
                    onClick={() => shift(1)}
                >
                    <ChevronIcon direction="right" />
                </button>
            </div>
            <div
                role="grid"
                aria-label={title}
                className="dpp-periods__grid"
                onMouseLeave={() => props.onHover?.(undefined)}
            >
                {rows.map((row, r) => (
                    <div role="row" key={r} className="dpp-periods__row">
                        {row.map((period, c) => {
                            const index = r * cols + c;
                            const disabled = props.isDisabled(period);
                            const isStart = samePeriod(period, from, unit);
                            const isEnd = samePeriod(period, to, unit);
                            const inside =
                                rangeShown &&
                                periodDifference(period, startOfPeriod(from!, unit), unit) > 0 &&
                                periodDifference(startOfPeriod(to!, unit), period, unit) > 0;
                            const selected = isStart || isEnd || inside;
                            const label = labelOf(period, unit, locale);
                            const prefix = unit === "month" ? texts.monthPrefix : texts.selectPrefix;
                            return (
                                <div
                                    role="gridcell"
                                    key={c}
                                    aria-selected={selected || undefined}
                                    className="dpp-periods__cell"
                                >
                                    <button
                                        ref={el => {
                                            buttonsRef.current[index] = el;
                                        }}
                                        type="button"
                                        tabIndex={index === focusIndex ? 0 : -1}
                                        disabled={disabled}
                                        aria-label={`${prefix} ${label.long}${disabled ? `, ${texts.disabled}` : ""}`}
                                        className={classNames("dpp-period", {
                                            "dpp-period--current": samePeriod(period, today, unit),
                                            "dpp-period--selected": isStart || isEnd,
                                            "dpp-period--range-start": rangeShown && isStart && !isEnd,
                                            "dpp-period--range-end": rangeShown && isEnd && !isStart,
                                            "dpp-period--range-middle": inside,
                                            "dpp-period--preview": pending && (inside || isEnd),
                                            "dpp-period--disabled": disabled
                                        })}
                                        onClick={() => props.onPick(period)}
                                        onFocus={() => {
                                            setFocusIndex(index);
                                            props.onHover?.(period);
                                        }}
                                        onMouseEnter={() => props.onHover?.(period)}
                                        onKeyDown={event => handleKeyDown(event, index)}
                                    >
                                        {label.short}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
