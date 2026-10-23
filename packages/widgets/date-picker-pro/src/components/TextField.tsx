// The "Free text" typing mode: an ordinary input read when it loses focus or on Enter.
import classNames from "classnames";
import { useState, type KeyboardEvent, type ReactElement } from "react";

import { formatDate } from "../core/pattern";
import type { RelativeResult } from "../core/relative";
import type { FieldMessages, SegmentedFieldProps } from "./SegmentedField";
import { resolveTypedText } from "./typing";

export function TextField(props: SegmentedFieldProps & { messages: FieldMessages }): ReactElement {
    const { tokens, locale, value, messages, onMessage } = props;
    const shown = value ? formatDate(value, tokens, locale) : "";
    const [text, setText] = useState(shown);
    const [lastShown, setLastShown] = useState(shown);
    if (lastShown !== shown) {
        setLastShown(shown);
        setText(shown);
    }

    const accept = (): void => {
        const trimmed = text.trim();
        if (!trimmed) {
            if (props.clearable) {
                onMessage?.(undefined);
                props.onChange(undefined);
            } else {
                setText(shown);
            }
            return;
        }
        if (trimmed === shown) {
            return;
        }
        const result: RelativeResult | undefined = resolveTypedText(trimmed, {
            ...props.typing,
            reference: props.reference ?? value
        });
        if (!result) {
            onMessage?.(messages.invalidDate);
            return;
        }
        const date = result.kind === "date" ? result.date : result.start;
        if (result.kind === "date" && props.isDisabled?.(date)) {
            onMessage?.(`${messages.disabled}: ${formatDate(date, tokens, locale)}`);
            return;
        }
        onMessage?.(undefined);
        if (props.onTyped) {
            props.onTyped(result);
        } else {
            props.onChange(date);
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
        if (event.key === "?" && !text) {
            props.onKeyDown?.(event);
            return;
        }
        if (event.key !== "?") {
            props.onKeyDown?.(event);
        }
        if (event.defaultPrevented) {
            return;
        }
        if (event.key === "Enter") {
            accept();
        } else if (event.key === "Escape") {
            setText(shown);
            onMessage?.(undefined);
        }
    };

    return (
        <input
            id={props.id}
            className={classNames("dpp-field dpp-field--text", props.className)}
            value={text}
            placeholder={props.placeholder}
            aria-label={props.labelledBy ? undefined : props.label}
            aria-labelledby={props.labelledBy}
            readOnly={props.readOnly}
            tabIndex={props.tabIndex}
            autoComplete="off"
            onChange={event => setText(event.target.value)}
            onBlur={accept}
            onKeyDown={handleKeyDown}
        />
    );
}
