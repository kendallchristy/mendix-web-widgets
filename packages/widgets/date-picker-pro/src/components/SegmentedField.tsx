// A date field split into day, month, year (and time) segments. Typing digits fills a segment and moves on, so
// separators are never typed. Letters, + and - switch to a quick-entry box for relative shortcuts or pasted text.
import classNames from "classnames";
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type ClipboardEvent,
    type KeyboardEvent,
    type ReactElement
} from "react";

import type { LocaleInfo } from "../core/locale";
import {
    buildDate,
    formatDate,
    matchMonthPrefix,
    partsFromDate,
    segmentBounds,
    segmentTokens,
    type DateParts,
    type SegmentType,
    type Token
} from "../core/pattern";
import { startsRelative, type RelativeResult } from "../core/relative";
import { resolveTypedText, type TypedTextContext } from "./typing";

type SegmentToken = Extract<Token, { kind: "segment" }>;

export interface FieldMessages {
    invalidDate: string;
    disabled: string;
    maskError: string;
    includeInvalidChar: boolean;
}

export interface SegmentedFieldProps {
    tokens: Token[];
    locale: LocaleInfo;
    value?: Date;
    /** Fills the parts the format doesn't have, like the date of a time-only field. Defaults to the value. */
    reference?: Date;
    label: string;
    labelledBy?: string;
    id?: string;
    placeholder?: string;
    className?: string;
    readOnly?: boolean;
    clearable: boolean;
    tabIndex?: number;
    typing: TypedTextContext;
    messages: FieldMessages;
    isDisabled?: (date: Date) => boolean;
    /** A complete, valid date was typed, or the field was emptied (undefined). */
    onChange: (date: Date | undefined) => void;
    /** A shortcut was typed. Ranges ("last month") go here so a range picker can fill both fields. */
    onTyped?: (result: RelativeResult) => void;
    onMessage?: (message: string | undefined) => void;
    /** Keys the field doesn't use, like Alt+ArrowDown or "?", go to the picker first. */
    onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
}

const segmentLabels: Record<SegmentType, string> = {
    year: "year",
    month: "month",
    day: "day",
    hour: "hour",
    minute: "minute",
    second: "second",
    millisecond: "millisecond",
    dayPeriod: "AM/PM",
    quarter: "quarter"
};

function placeholderFor(token: SegmentToken): string {
    switch (token.type) {
        case "year":
            return token.length === 2 ? "yy" : "yyyy";
        case "month":
            return token.length >= 3 ? "mmm" : "mm";
        case "day":
            return "dd";
        case "hour":
            return "hh";
        case "minute":
            return "mm";
        case "second":
            return "ss";
        case "millisecond":
            return "SSS";
        case "dayPeriod":
            return "--";
        case "quarter":
            return "Q-";
    }
}

function segmentText(token: SegmentToken, value: number | undefined, locale: LocaleInfo, buffer?: string): string {
    if (value === undefined) {
        return placeholderFor(token);
    }
    if (
        buffer !== undefined &&
        token.type !== "dayPeriod" &&
        !(token.type === "month" && token.length >= 3 && /\D/.test(buffer))
    ) {
        return buffer.padStart(token.type === "year" ? 0 : Math.min(token.length, 2), "0");
    }
    switch (token.type) {
        case "month":
            if (token.length >= 4) {
                return locale.monthsLong[value - 1] ?? "";
            }
            if (token.length === 3) {
                return locale.monthsShort[value - 1] ?? "";
            }
            return String(value).padStart(token.length, "0");
        case "dayPeriod":
            return locale.dayPeriods[value] ?? "";
        case "quarter":
            return token.length >= 3 ? `Q${value}` : String(value);
        case "year":
            return token.length === 2
                ? String(value % 100).padStart(2, "0")
                : String(value).padStart(token.length, "0");
        default:
            return String(value).padStart(token.length, "0");
    }
}

function inBounds(parts: DateParts, tokens: Token[]): boolean {
    return segmentTokens(tokens).every(token => {
        const value = parts[token.type];
        if (value === undefined) {
            return false;
        }
        const { min, max } = segmentBounds(token, parts);
        return value >= min && value <= max;
    });
}

const sameTime = (a?: Date, b?: Date): boolean => (a?.getTime() ?? null) === (b?.getTime() ?? null);

export function SegmentedField(props: SegmentedFieldProps): ReactElement {
    const { tokens, locale, value, readOnly, messages, onMessage } = props;
    const segments = segmentTokens(tokens);
    const [parts, setParts] = useState<DateParts>(() => partsFromDate(value, tokens));
    const partsRef = useRef(parts);
    const pendingEmitRef = useRef(false);
    const storeParts = (next: DateParts): void => {
        partsRef.current = next;
        setParts(next);
    };
    const [quick, setQuick] = useState<string | undefined>();
    const [focused, setFocused] = useState(false);
    // Digits typed into the current segment so far ("2", "20", "202" on the way to "2026").
    const bufferRef = useRef<{ index: number; text: string } | undefined>(undefined);
    const [buffer, setBufferState] = useState<{ index: number; text: string } | undefined>();
    const setBuffer = (next: { index: number; text: string } | undefined): void => {
        bufferRef.current = next;
        setBufferState(next);
    };
    const bufferAt = (index: number): string | undefined =>
        bufferRef.current?.index === index ? bufferRef.current.text : undefined;
    const segmentsRef = useRef<Array<HTMLSpanElement | null>>([]);
    const quickRef = useRef<HTMLInputElement>(null);
    const groupRef = useRef<HTMLDivElement>(null);
    const lastEmittedRef = useRef<Date | undefined>(value);
    const pendingFocusRef = useRef<number | undefined>(undefined);

    // Follow the value when it changes from outside (the calendar, a preset, a nanoflow).
    useEffect(() => {
        if (!sameTime(value, lastEmittedRef.current)) {
            lastEmittedRef.current = value;
            setBuffer(undefined);
            storeParts(partsFromDate(value, tokens));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value?.getTime()]);

    useLayoutEffect(() => {
        if (pendingFocusRef.current !== undefined) {
            segmentsRef.current[pendingFocusRef.current]?.focus();
            pendingFocusRef.current = undefined;
        }
    });

    useEffect(() => {
        if (quick !== undefined) {
            const input = quickRef.current;
            if (input && document.activeElement !== input) {
                input.focus();
                input.setSelectionRange(input.value.length, input.value.length);
            }
        }
    }, [quick !== undefined]); // eslint-disable-line react-hooks/exhaustive-deps

    const emit = useCallback(
        (date: Date | undefined) => {
            if (!sameTime(date, lastEmittedRef.current)) {
                lastEmittedRef.current = date;
                props.onChange(date);
            }
        },
        [props]
    );

    /** Shows new parts; saves them unless a segment is still waiting for more digits. */
    const update = (next: DateParts, emitNow = true): void => {
        storeParts(next);
        pendingEmitRef.current = !emitNow;
        if (emitNow) {
            evaluate(next);
        }
    };

    const flush = (): void => {
        if (pendingEmitRef.current) {
            pendingEmitRef.current = false;
            evaluate(partsRef.current);
        }
    };

    const evaluate = (next: DateParts): void => {
        const filled = segments.filter(token => next[token.type] !== undefined).length;
        if (filled === 0) {
            onMessage?.(undefined);
            if (props.clearable) {
                emit(undefined);
            }
            return;
        }
        if (filled < segments.length) {
            onMessage?.(undefined);
            return;
        }
        const date = inBounds(next, tokens) ? buildDate(next, tokens, props.reference ?? value) : null;
        if (!date) {
            onMessage?.(messages.invalidDate);
            return;
        }
        if (props.isDisabled?.(date)) {
            onMessage?.(`${messages.disabled}: ${formatDate(date, tokens, locale)}`);
            return;
        }
        onMessage?.(undefined);
        emit(date);
    };

    const focusSegment = (index: number): void => {
        flush();
        const clamped = Math.max(0, Math.min(segments.length - 1, index));
        segmentsRef.current[clamped]?.focus();
    };

    const revert = (): void => {
        setBuffer(undefined);
        pendingEmitRef.current = false;
        storeParts(partsFromDate(value, tokens));
        onMessage?.(undefined);
    };

    const startQuick = (text: string): void => {
        setBuffer(undefined);
        setQuick(text);
        onMessage?.(undefined);
    };

    const showMaskError = (char: string): void => {
        if (messages.maskError) {
            onMessage?.(messages.includeInvalidChar ? `${messages.maskError} (${char})` : messages.maskError);
        }
    };

    const applyTyped = (text: string): boolean => {
        const result = resolveTypedText(text, {
            ...props.typing,
            reference: props.reference ?? value
        });
        if (!result) {
            onMessage?.(messages.invalidDate);
            return false;
        }
        const date = result.kind === "date" ? result.date : result.start;
        if (result.kind === "date" && props.isDisabled?.(date)) {
            onMessage?.(`${messages.disabled}: ${formatDate(date, tokens, locale)}`);
            return false;
        }
        onMessage?.(undefined);
        if (props.onTyped) {
            props.onTyped(result);
            lastEmittedRef.current = undefined;
        } else {
            emit(date);
        }
        storeParts(partsFromDate(date, tokens));
        return true;
    };

    const typeDigit = (index: number, token: SegmentToken, digit: string): void => {
        const parts = partsRef.current;
        const bounds = segmentBounds(token, parts);
        let buffer = (bufferAt(index) ?? "") + digit;
        if (buffer.length > bounds.digits) {
            buffer = digit;
        }
        let number = Number(buffer);
        if (number > bounds.max) {
            buffer = digit;
            number = Number(digit);
        }
        setBuffer({ index, text: buffer });
        const full = buffer.length >= bounds.digits || number * 10 > bounds.max;
        // "2" in a year segment isn't year 2 yet: wait for the segment to fill or lose focus.
        update({ ...parts, [token.type]: number }, full);
        if (full && index < segments.length - 1) {
            setBuffer(undefined);
            pendingFocusRef.current = index + 1;
        }
    };

    const typeLetter = (index: number, token: SegmentToken, letter: string): boolean => {
        const parts = partsRef.current;
        if (token.type === "dayPeriod") {
            const lower = letter.toLowerCase();
            const period = locale.dayPeriods.findIndex(p => p.toLowerCase().startsWith(lower));
            const choice = period >= 0 ? period : lower === "a" ? 0 : lower === "p" ? 1 : -1;
            if (choice >= 0) {
                update({ ...parts, dayPeriod: choice });
                if (index < segments.length - 1) {
                    pendingFocusRef.current = index + 1;
                }
                return true;
            }
            return false;
        }
        if (token.type === "month" && token.length >= 3) {
            const previous = bufferAt(index);
            const typed = (previous && /\D/.test(previous) ? previous : "") + letter;
            const matches = matchMonthPrefix(typed, locale);
            if (matches.length) {
                setBuffer({ index, text: typed });
                update({ ...parts, month: matches[0] + 1 });
                if (matches.length === 1 && index < segments.length - 1) {
                    setBuffer(undefined);
                    pendingFocusRef.current = index + 1;
                }
                return true;
            }
        }
        return false;
    };

    const step = (token: SegmentToken, delta: number): void => {
        const parts = partsRef.current;
        const bounds = segmentBounds(token, parts);
        const current = parts[token.type];
        let next: number;
        if (current === undefined) {
            next = partsFromDate(new Date(), tokens)[token.type] ?? bounds.min;
        } else {
            next = current + delta;
            if (next > bounds.max) {
                next = bounds.min;
            } else if (next < bounds.min) {
                next = bounds.max;
            }
        }
        setBuffer(undefined);
        update({ ...parts, [token.type]: next });
    };

    const handleSegmentKey = (index: number, token: SegmentToken) => (event: KeyboardEvent<HTMLSpanElement>) => {
        const parts = partsRef.current;
        if (event.key === "Enter") {
            flush();
        }
        props.onKeyDown?.(event);
        if (event.defaultPrevented || readOnly) {
            return;
        }
        const { key } = event;
        if (event.ctrlKey || event.metaKey || (event.altKey && key.length > 1)) {
            return;
        }
        if (key === "Tab" || key === "Enter" || key === "Escape") {
            if (key === "Escape" && !sameTime(buildDate(parts, tokens, value) ?? undefined, value)) {
                revert();
            }
            return;
        }
        event.preventDefault();
        switch (key) {
            case "ArrowLeft":
                setBuffer(undefined);
                focusSegment(index - 1);
                return;
            case "ArrowRight":
                setBuffer(undefined);
                focusSegment(index + 1);
                return;
            case "ArrowUp":
                step(token, 1);
                return;
            case "ArrowDown":
                step(token, -1);
                return;
            case "Home":
                setBuffer(undefined);
                focusSegment(0);
                return;
            case "End":
                setBuffer(undefined);
                focusSegment(segments.length - 1);
                return;
            case "Backspace":
            case "Delete": {
                const buffer = bufferAt(index);
                if (buffer && buffer.length > 1 && /^\d+$/.test(buffer)) {
                    const shorter = buffer.slice(0, -1);
                    setBuffer({ index, text: shorter });
                    update({ ...parts, [token.type]: Number(shorter) }, false);
                } else if (parts[token.type] !== undefined) {
                    setBuffer(undefined);
                    update({ ...parts, [token.type]: undefined });
                } else if (key === "Backspace" && index > 0) {
                    focusSegment(index - 1);
                }
                return;
            }
        }
        if (key.length !== 1) {
            return;
        }
        if (/\d/.test(key) && token.type !== "dayPeriod") {
            typeDigit(index, token, key);
            return;
        }
        const empty = segments.every(t => parts[t.type] === undefined);
        if (props.typing.relativeTyping && (key === "+" || (key === "-" && empty))) {
            startQuick(key);
            return;
        }
        if (/\p{L}/u.test(key) && typeLetter(index, token, key)) {
            return;
        }
        // A separator moves on to the next segment, so "1/2/2026" can be typed out in full.
        const next = tokens[tokens.indexOf(token) + 1];
        if (next?.kind === "literal" && next.text.includes(key)) {
            if (bufferAt(index) !== undefined && index < segments.length - 1) {
                setBuffer(undefined);
                focusSegment(index + 1);
            }
            return;
        }
        if (props.typing.relativeTyping && startsRelative(key)) {
            startQuick(key);
            return;
        }
        if (!/\s/.test(key)) {
            showMaskError(key);
        }
    };

    // Phones send text through beforeinput instead of keydown; route it through the same handler.
    useEffect(() => {
        const group = groupRef.current;
        if (!group) {
            return;
        }
        const listener = (event: Event): void => {
            const input = event as InputEvent;
            const index = segmentsRef.current.findIndex(el => el === input.target);
            if (index < 0) {
                return;
            }
            input.preventDefault();
            const keys = input.inputType === "deleteContentBackward" ? ["Backspace"] : Array.from(input.data ?? "");
            for (const key of keys) {
                segmentsRef.current[index]?.dispatchEvent(
                    new KeyboardEvent("keydown", {
                        key,
                        bubbles: true,
                        cancelable: true
                    })
                );
            }
        };
        group.addEventListener("beforeinput", listener);
        return () => group.removeEventListener("beforeinput", listener);
    });

    const handlePaste = (event: ClipboardEvent<HTMLElement>): void => {
        if (readOnly) {
            return;
        }
        event.preventDefault();
        const text = event.clipboardData.getData("text");
        if (!applyTyped(text)) {
            startQuick(text);
        }
    };

    const handleBlur = (): void => {
        // Wait for focus to land, so moving between segments doesn't count as leaving the field.
        setTimeout(() => {
            if (!groupRef.current?.contains(document.activeElement)) {
                setFocused(false);
                setBuffer(undefined);
                const parts = partsRef.current;
                const filled = segments.filter(token => parts[token.type] !== undefined).length;
                if (filled > 0 && filled < segments.length) {
                    revert();
                } else if (filled === 0 && !props.clearable) {
                    revert();
                }
            }
        });
    };

    const closeQuick = (accept: boolean): void => {
        const text = quick ?? "";
        if (accept && text.trim()) {
            if (!applyTyped(text)) {
                return;
            }
        } else {
            onMessage?.(undefined);
        }
        setQuick(undefined);
        pendingFocusRef.current = 0;
    };

    const empty = segments.every(token => parts[token.type] === undefined);
    const showPlaceholder = empty && !focused && !!props.placeholder && quick === undefined;
    const complete = !empty && inBounds(parts, tokens) ? buildDate(parts, tokens, props.reference ?? value) : undefined;
    let segmentIndex = -1;

    return (
        <div
            ref={groupRef}
            id={props.id}
            role="group"
            aria-label={props.labelledBy ? undefined : props.label}
            aria-labelledby={props.labelledBy}
            className={classNames("dpp-field", props.className, {
                "dpp-field--empty": empty,
                "dpp-field--readonly": readOnly
            })}
            onFocus={() => setFocused(true)}
            onBlur={handleBlur}
            onPaste={handlePaste}
        >
            {quick !== undefined ? (
                <input
                    ref={quickRef}
                    className="dpp-field__quick"
                    value={quick}
                    aria-label={props.label}
                    autoComplete="off"
                    spellCheck={false}
                    onChange={event => setQuick(event.target.value)}
                    onKeyDown={event => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            closeQuick(true);
                        } else if (event.key === "Escape") {
                            event.preventDefault();
                            event.stopPropagation();
                            closeQuick(false);
                        }
                    }}
                    onBlur={() => {
                        if (quick.trim()) {
                            if (!applyTyped(quick)) {
                                onMessage?.(undefined);
                            }
                        }
                        setQuick(undefined);
                    }}
                />
            ) : showPlaceholder ? (
                <span
                    className="dpp-field__placeholder"
                    tabIndex={readOnly ? -1 : (props.tabIndex ?? 0)}
                    onFocus={() => {
                        setFocused(true);
                        pendingFocusRef.current = 0;
                    }}
                >
                    {props.placeholder}
                </span>
            ) : (
                tokens.map((token, position) => {
                    if (token.kind === "literal") {
                        return (
                            <span key={position} className="dpp-field__literal" aria-hidden>
                                {token.text}
                            </span>
                        );
                    }
                    if (token.kind === "display") {
                        return (
                            <span key={position} className="dpp-field__display" aria-hidden>
                                {complete ? formatDate(complete, [token], locale) : ""}
                            </span>
                        );
                    }
                    const index = ++segmentIndex;
                    const current = parts[token.type];
                    const bounds = segmentBounds(token, parts);
                    const text = segmentText(token, current, locale, buffer?.index === index ? buffer.text : undefined);
                    return (
                        <span
                            key={position}
                            ref={el => {
                                segmentsRef.current[index] = el;
                            }}
                            role="spinbutton"
                            tabIndex={readOnly ? -1 : index === 0 ? (props.tabIndex ?? 0) : 0}
                            aria-label={`${props.label}, ${segmentLabels[token.type]}`}
                            aria-valuemin={bounds.min}
                            aria-valuemax={bounds.max}
                            aria-valuenow={current}
                            aria-valuetext={current === undefined ? "empty" : text}
                            aria-readonly={readOnly || undefined}
                            contentEditable={!readOnly}
                            suppressContentEditableWarning
                            inputMode={
                                token.type === "dayPeriod" || (token.type === "month" && token.length >= 3)
                                    ? "text"
                                    : "numeric"
                            }
                            spellCheck={false}
                            autoCorrect="off"
                            className={classNames("dpp-field__segment", `dpp-field__segment--${token.type}`, {
                                "dpp-field__segment--placeholder": current === undefined
                            })}
                            onKeyDown={handleSegmentKey(index, token)}
                            onFocus={() => {
                                setBuffer(undefined);
                            }}
                            onBlur={flush}
                        >
                            {text}
                        </span>
                    );
                })
            )}
        </div>
    );
}
