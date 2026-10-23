// The whole picker without Mendix: trigger (fields, button or nothing for inline), popup and help. The Mendix
// container turns widget properties into a PickerConfig and saves what this commits.
import {
    arrow,
    autoPlacement,
    autoUpdate,
    flip,
    FloatingArrow,
    FloatingFocusManager,
    FloatingOverlay,
    offset,
    shift,
    useDismiss,
    useFloating,
    useInteractions,
    useRole,
    type Placement
} from "@floating-ui/react";
import classNames from "classnames";
import { useId, useMemo, useState, type CSSProperties, type KeyboardEvent, type ReactElement } from "react";

import { findActivePreset } from "../core/presets";
import { shortcutSections } from "../core/shortcuts";
import { formatDate, partsFromDate, segmentTokens } from "../core/pattern";
import type { Edge, PickerValue } from "../core/types";
import { HelpContent } from "./HelpContent";
import { useMediaQuery } from "./hooks";
import { CalendarIcon, ClearIcon, HelpIcon } from "./Icons";
import { Panel } from "./Panel";
import { SegmentedField, type SegmentedFieldProps } from "./SegmentedField";
import { TextField } from "./TextField";
import type { PickerConfig } from "./types";
import { usePickerState } from "./usePickerState";

export interface DatePickerViewProps {
    config: PickerConfig;
    value: PickerValue;
    onCommit: (value: PickerValue) => void;
    onOpenChange?: (open: boolean) => void;
    /** True while something outside (the close attribute) asks the popup to close. */
    closeRequested?: boolean;
    onCloseHandled?: () => void;
    /** Validation from Mendix, shown under the field. */
    validation?: string;
    className?: string;
    style?: CSSProperties;
}

const placements: Record<PickerConfig["alignment"], Placement> = {
    left: "bottom-start",
    right: "bottom-end",
    auto: "bottom-start"
};

/** "dd/MM/yyyy" → typed "10012026", shown "10/01/2026": the example in the help. */
function typingExample(config: PickerConfig): { typed: string; shown: string } | undefined {
    const sample = new Date(new Date().getFullYear(), 0, 10, 14, 30);
    const segments = segmentTokens(config.tokens);
    if (!segments.length) {
        return undefined;
    }
    const parts = partsFromDate(sample, config.tokens);
    const typed = segments
        .map(token => {
            const value = parts[token.type];
            if (token.type === "dayPeriod") {
                return config.locale.dayPeriods[value ?? 0].charAt(0).toLowerCase();
            }
            if (token.type === "month" && token.length >= 3) {
                return config.locale.monthsShort[(value ?? 1) - 1].slice(0, 3).toLowerCase();
            }
            return String(value).padStart(token.type === "year" ? token.length : Math.min(token.length, 2) || 2, "0");
        })
        .join("");
    return { typed, shown: formatDate(sample, config.tokens, config.locale) };
}

export function DatePickerView(props: DatePickerViewProps): ReactElement {
    const { config, value } = props;
    const { selection, texts, trigger } = config;
    const inline = trigger === "inline";
    const mobile = useMediaQuery(`(max-width: ${Math.max(0, config.mobileBreakpoint - 1)}px)`);
    const numberOfMonths = mobile ? 1 : config.monthsToDisplay;
    const [state, actions] = usePickerState({
        config,
        value,
        onCommit: props.onCommit,
        onOpenChange: props.onOpenChange,
        closeRequested: props.closeRequested,
        onCloseHandled: props.onCloseHandled,
        inline,
        numberOfMonths
    });
    const [fieldMessage, setFieldMessage] = useState<string | undefined>();
    const [helpOpen, setHelpOpen] = useState(false);
    const [openedByKeyboard, setOpenedByKeyboard] = useState(false);
    const [arrowElement, setArrowElement] = useState<SVGSVGElement | null>(null);
    const labelId = config.id ? `${config.id}-label` : undefined;
    const helpTitleId = useId();
    const example = useMemo(() => typingExample(config), [config]);
    const canEdit = !config.readOnly;

    const {
        refs: { setReference, setFloating },
        floatingStyles,
        context
    } = useFloating({
        open: state.open && !inline,
        onOpenChange: open => (open ? actions.openPopup() : actions.close()),
        placement: placements[config.alignment],
        strategy: "fixed",
        whileElementsMounted: autoUpdate,
        middleware: [
            offset(config.showArrow ? 10 : 6),
            config.alignment === "auto"
                ? autoPlacement({
                      allowedPlacements: ["bottom-start", "bottom-end", "top-start", "top-end"]
                  })
                : flip(),
            shift({ padding: 8 }),
            ...(config.showArrow ? [arrow({ element: arrowElement })] : [])
        ]
    });
    const dismiss = useDismiss(context, { enabled: !mobile });
    const role = useRole(context, { role: "dialog" });
    const { getReferenceProps, getFloatingProps } = useInteractions([dismiss, role]);

    const {
        refs: { setReference: setHelpReference, setFloating: setHelpFloating },
        floatingStyles: helpStyles,
        context: helpContext
    } = useFloating({
        open: helpOpen,
        onOpenChange: setHelpOpen,
        placement: "bottom-end",
        strategy: "fixed",
        whileElementsMounted: autoUpdate,
        middleware: [offset(6), flip(), shift({ padding: 8 })]
    });
    const helpInteractions = useInteractions([useDismiss(helpContext), useRole(helpContext, { role: "dialog" })]);

    const toggle = (byKeyboard = false): void => {
        if (!canEdit) {
            return;
        }
        setOpenedByKeyboard(byKeyboard);
        if (state.open) {
            actions.close();
        } else {
            actions.openPopup();
        }
    };

    const handleTriggerKeys = (event: KeyboardEvent<HTMLElement>): void => {
        if (event.altKey && event.key === "ArrowDown") {
            event.preventDefault();
            toggle(true);
        } else if (event.key === "?" && config.helpButton !== "hidden") {
            event.preventDefault();
            if (config.helpButton === "beside") {
                setHelpOpen(open => !open);
            } else {
                setOpenedByKeyboard(true);
                actions.openPopup("help");
            }
        } else if (event.key === "Escape" && state.open) {
            actions.close();
        }
    };

    const fieldProps = (edge: Edge): SegmentedFieldProps => ({
        tokens: config.tokens,
        locale: config.locale,
        value: value[edge],
        reference: value[edge] ?? (edge === "end" ? value.start : undefined),
        label: selection === "range" ? (edge === "start" ? texts.start : texts.end) : texts.start,
        labelledBy: selection === "single" ? labelId : undefined,
        id: edge === "start" ? config.id : undefined,
        placeholder: edge === "end" ? texts.endPlaceholder : texts.placeholder,
        readOnly: config.readOnly,
        clearable: config.clearable,
        tabIndex: config.tabIndex,
        typing: {
            tokens: config.tokens,
            locale: config.locale,
            weekStartsOn: config.weekStartsOn,
            relativeTyping: config.relativeTyping
        },
        messages: {
            invalidDate: texts.invalidDate,
            disabled: texts.disabled,
            maskError: texts.maskError,
            includeInvalidChar: texts.includeInvalidChar
        },
        isDisabled: config.granularity === "time" ? undefined : config.isDayDisabled,
        onChange: date => setFieldMessage(actions.commitEdge(edge, date)),
        onTyped: result => setFieldMessage(actions.commitTyped(result, edge)),
        onMessage: setFieldMessage,
        onKeyDown: handleTriggerKeys
    });

    const Field = config.segmented ? SegmentedField : TextField;
    const hasValue = !!(value.start || value.end);
    const showClear = config.clearable && hasValue && canEdit;
    const icon = config.icon ?? <CalendarIcon />;

    const formatted = (date: Date | undefined): string =>
        date ? formatDate(date, config.displayTokens, config.locale) : "";
    const activePreset = findActivePreset(config.presets, value, selection, config.granularity);
    const buttonText = (() => {
        if (!hasValue) {
            return activePreset?.id === "allTime" ? activePreset.label : texts.placeholder;
        }
        if (selection === "single") {
            return formatted(value.start);
        }
        return `${formatted(value.start) || "…"} – ${formatted(value.end) || "…"}`;
    })();

    const helpButton =
        config.helpButton === "beside" && canEdit ? (
            <>
                <button
                    ref={setHelpReference}
                    type="button"
                    className={classNames("dpp-icon-button dpp-help-button", {
                        "dpp-icon-button--active": helpOpen
                    })}
                    aria-label={texts.help}
                    aria-expanded={helpOpen}
                    title={texts.help}
                    {...helpInteractions.getReferenceProps({
                        onClick: () => setHelpOpen(open => !open)
                    })}
                >
                    <HelpIcon />
                </button>
                {helpOpen ? (
                    <FloatingFocusManager context={helpContext} modal={false} initialFocus={-1}>
                        <div
                            ref={setHelpFloating}
                            style={helpStyles}
                            className="dpp-popover dpp-help-popover"
                            aria-labelledby={helpTitleId}
                            {...helpInteractions.getFloatingProps()}
                        >
                            <HelpContent
                                title={texts.help}
                                titleId={helpTitleId}
                                custom={config.customHelp}
                                sections={shortcutSections({
                                    selection,
                                    granularity: config.granularity,
                                    hasTime: config.hasTime,
                                    relativeTyping: config.relativeTyping,
                                    segmented: config.segmented,
                                    inline,
                                    typingExample: example
                                })}
                            />
                        </div>
                    </FloatingFocusManager>
                ) : null}
            </>
        ) : null;

    const panel = (
        <Panel
            config={config}
            state={state}
            actions={actions}
            numberOfMonths={numberOfMonths}
            mobile={mobile}
            autoFocus={!inline && (openedByKeyboard || trigger === "button")}
            showFields={trigger !== "input" || config.applyMode}
            labelledBy={labelId}
            typingExample={example}
        />
    );

    const messages = [fieldMessage, props.validation].filter(Boolean);
    const rootClass = classNames("widget-date-picker-pro", props.className, `dpp--${config.density}`, {
        "dpp--readonly": config.readOnly,
        "dpp--open": state.open && !inline
    });

    if (config.readOnly && config.readOnlyAsText) {
        const text =
            selection === "single"
                ? formatDate(value.start ?? new Date(NaN), config.tokens, config.locale)
                : `${value.start ? formatDate(value.start, config.tokens, config.locale) : ""} – ${
                      value.end ? formatDate(value.end, config.tokens, config.locale) : ""
                  }`;
        return (
            <div className={rootClass} style={props.style}>
                <span className="form-control-static" id={config.id}>
                    {hasValue ? text : ""}
                </span>
            </div>
        );
    }

    if (inline) {
        return (
            <div
                className={rootClass}
                style={props.style}
                id={config.id}
                role="group"
                aria-labelledby={labelId}
                onFocus={event => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                        props.onOpenChange?.(true);
                    }
                }}
                onBlur={event => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                        props.onOpenChange?.(false);
                    }
                }}
            >
                {panel}
                {messages.map((message, index) => (
                    <div key={index} className="alert alert-danger mx-validation-message">
                        {message}
                    </div>
                ))}
            </div>
        );
    }

    const iconButton = config.showIcon ? (
        <button
            type="button"
            className={classNames("dpp-icon-button dpp-trigger__icon", {
                "dpp-trigger__icon--beside": config.iconBeside
            })}
            aria-label={texts.calendarButton}
            aria-expanded={state.open}
            aria-haspopup="dialog"
            disabled={!canEdit}
            onClick={() => toggle(false)}
            onKeyDown={event => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggle(true);
                }
            }}
        >
            {icon}
        </button>
    ) : null;

    const clearButton = showClear ? (
        <button
            type="button"
            className="dpp-icon-button dpp-trigger__clear"
            aria-label={texts.clear}
            title={texts.clear}
            onClick={() => {
                setFieldMessage(undefined);
                props.onCommit({});
            }}
        >
            <ClearIcon />
        </button>
    ) : null;

    const triggerElement =
        trigger === "button" ? (
            <div className="dpp-trigger dpp-trigger--button">
                <button
                    type="button"
                    id={config.id}
                    className={classNames("dpp-button", {
                        "dpp-button--empty": !hasValue
                    })}
                    aria-haspopup="dialog"
                    aria-expanded={state.open}
                    aria-labelledby={labelId ? `${labelId} ${config.id}` : undefined}
                    disabled={!canEdit}
                    tabIndex={config.tabIndex}
                    {...getReferenceProps({
                        onClick: () => toggle(false),
                        onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
                            if (event.key === "ArrowDown" || event.key === "?") {
                                handleTriggerKeys(event);
                            }
                        }
                    })}
                    ref={setReference}
                >
                    {config.showIcon ? <span className="dpp-button__icon">{icon}</span> : null}
                    <span className="dpp-button__text">{buttonText}</span>
                </button>
                {clearButton}
                {helpButton}
            </div>
        ) : (
            <div className="dpp-trigger dpp-trigger--input">
                <div
                    ref={setReference}
                    className={classNames("form-control dpp-input", {
                        "dpp-input--range": selection === "range",
                        "dpp-input--icon-inside": config.showIcon && !config.iconBeside
                    })}
                    onClick={event => {
                        // Clicking the empty part of the box opens the calendar; clicking a segment just edits it.
                        if (event.target === event.currentTarget) {
                            toggle(false);
                        }
                    }}
                    {...getReferenceProps()}
                >
                    {!config.iconBeside ? iconButton : null}
                    <Field {...fieldProps("start")} />
                    {selection === "range" ? (
                        <>
                            <span className="dpp-input__dash" aria-hidden>
                                –
                            </span>
                            <Field {...fieldProps("end")} />
                        </>
                    ) : null}
                    {clearButton}
                </div>
                {config.iconBeside ? iconButton : null}
                {helpButton}
            </div>
        );

    const popup =
        state.open && !inline ? (
            mobile ? (
                <FloatingOverlay
                    lockScroll
                    className="dpp-overlay"
                    onClick={event => {
                        if (event.target === event.currentTarget) {
                            actions.close();
                        }
                    }}
                >
                    <FloatingFocusManager context={context} initialFocus={-1}>
                        <div
                            ref={setFloating}
                            className="dpp-popup dpp-popup--sheet"
                            aria-labelledby={labelId}
                            {...getFloatingProps()}
                        >
                            {panel}
                        </div>
                    </FloatingFocusManager>
                </FloatingOverlay>
            ) : (
                <FloatingFocusManager context={context} initialFocus={-1} returnFocus>
                    <div
                        ref={setFloating}
                        style={floatingStyles}
                        className="dpp-popup"
                        aria-labelledby={labelId}
                        {...getFloatingProps()}
                    >
                        {config.showArrow ? (
                            <FloatingArrow ref={setArrowElement} context={context} className="dpp-popup__arrow" />
                        ) : null}
                        {panel}
                    </div>
                </FloatingFocusManager>
            )
        ) : null;

    return (
        <div className={rootClass} style={props.style}>
            {triggerElement}
            {popup}
            {messages.map((message, index) => (
                <div key={index} className="alert alert-danger mx-validation-message">
                    {message}
                </div>
            ))}
        </div>
    );
}
