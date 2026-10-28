import { useEffect, useRef, useState, type ReactElement } from "react";

import { fillTemplate, type Labels } from "../core/labels";
import { Icon } from "./Icons";

export function SearchBar(props: {
    labels: Labels;
    query: string;
    count: number;
    active: number;
    onQuery(query: string): void;
    onStep(direction: 1 | -1): void;
    onClose(): void;
}): ReactElement {
    const { labels, count, active } = props;
    const input = useRef<HTMLInputElement>(null);
    const [text, setText] = useState(props.query);

    useEffect(() => {
        input.current?.focus();
        input.current?.select();
    }, []);

    // Search after a short pause in typing, so long documents aren't searched on every keystroke.
    const onQuery = props.onQuery;
    useEffect(() => {
        const timer = setTimeout(() => onQuery(text), 250);
        return () => {
            clearTimeout(timer);
        };
    }, [text, onQuery]);

    const status = !props.query.trim()
        ? ""
        : count === 0
          ? labels.noResults
          : fillTemplate(labels.searchResults, { current: active + 1, total: count });

    return (
        <div className="dvp-search" role="search">
            <Icon name="search" className="dvp-icon dvp-search-icon" />
            <input
                ref={input}
                className="dvp-search-input"
                type="search"
                value={text}
                placeholder={labels.searchPlaceholder}
                aria-label={labels.searchPlaceholder}
                onChange={event => setText(event.target.value)}
                onKeyDown={event => {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        if (text !== props.query) {
                            props.onQuery(text);
                        } else {
                            props.onStep(event.shiftKey ? -1 : 1);
                        }
                    } else if (event.key === "Escape") {
                        event.preventDefault();
                        event.stopPropagation();
                        props.onClose();
                    }
                }}
            />
            <span className="dvp-search-status" aria-live="polite">
                {status}
            </span>
            <button
                type="button"
                className="dvp-tool"
                onClick={() => props.onStep(-1)}
                disabled={count === 0}
                aria-label={labels.previousMatch}
                title={labels.previousMatch}
            >
                <Icon name="chevronUp" />
            </button>
            <button
                type="button"
                className="dvp-tool"
                onClick={() => props.onStep(1)}
                disabled={count === 0}
                aria-label={labels.nextMatch}
                title={labels.nextMatch}
            >
                <Icon name="chevronDown" />
            </button>
            <button
                type="button"
                className="dvp-tool"
                onClick={props.onClose}
                aria-label={labels.closeSearch}
                title={labels.closeSearch}
            >
                <Icon name="close" />
            </button>
        </div>
    );
}
