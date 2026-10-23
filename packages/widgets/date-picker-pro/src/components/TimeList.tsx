// The scrolling list of times beside the calendar.
import classNames from "classnames";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactElement } from "react";

import type { LocaleInfo } from "../core/locale";
import { formatDate, type Token } from "../core/pattern";

export interface TimeListProps {
    options: number[];
    /** Minutes after midnight of the current time, if any. */
    selected?: number;
    onPick: (minutes: number) => void;
    caption: string;
    /** Time tokens of the format, for showing each option. */
    tokens: Token[];
    locale: LocaleInfo;
    /** Start/End switch for ranges. */
    edgeSwitch?: ReactElement;
}

export function TimeList({
    options,
    selected,
    onPick,
    caption,
    tokens,
    locale,
    edgeSwitch
}: TimeListProps): ReactElement {
    const listRef = useRef<HTMLUListElement>(null);
    const nearest = (): number => {
        if (selected === undefined) {
            const now = new Date();
            const minutes = now.getHours() * 60 + now.getMinutes();
            const index = options.findIndex(option => option >= minutes);
            return index >= 0 ? index : 0;
        }
        const index = options.findIndex(option => option >= selected);
        return index >= 0 ? index : options.length - 1;
    };
    const [active, setActive] = useState(nearest);
    const [lastSelected, setLastSelected] = useState(selected);
    if (lastSelected !== selected) {
        setLastSelected(selected);
        setActive(nearest());
    }

    // Center the selected time when the list opens or the selection changes.
    useEffect(() => {
        const list = listRef.current;
        const item = list?.querySelector<HTMLElement>("[aria-selected='true']");
        if (list && item) {
            list.scrollTop = item.offsetTop - list.clientHeight / 2 + item.clientHeight / 2;
        }
    }, [selected]);

    const label = (minutes: number): string =>
        formatDate(new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60), tokens, locale);

    const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>): void => {
        const moves: Record<string, number> = {
            ArrowUp: -1,
            ArrowDown: 1,
            PageUp: -4,
            PageDown: 4
        };
        let next: number;
        if (event.key in moves) {
            next = Math.max(0, Math.min(options.length - 1, active + moves[event.key]));
        } else if (event.key === "Home") {
            next = 0;
        } else if (event.key === "End") {
            next = options.length - 1;
        } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (options[active] !== undefined) {
                onPick(options[active]);
            }
            return;
        } else {
            return;
        }
        event.preventDefault();
        setActive(next);
        (listRef.current?.children[next] as HTMLElement | undefined)?.scrollIntoView?.({ block: "nearest" });
    };

    const listId = `dpp-time-${useId().replace(/:/g, "")}`;

    return (
        <div className="dpp-time">
            <div className="dpp-time__caption" id={`${listId}-caption`}>
                {caption}
            </div>
            {edgeSwitch}
            <ul
                ref={listRef}
                role="listbox"
                tabIndex={0}
                aria-labelledby={`${listId}-caption`}
                aria-activedescendant={options.length ? `${listId}-${active}` : undefined}
                className="dpp-time__list"
                onKeyDown={handleKeyDown}
            >
                {options.map((minutes, index) => (
                    <li
                        key={minutes}
                        id={`${listId}-${index}`}
                        role="option"
                        aria-selected={minutes === selected}
                        className={classNames("dpp-time__option", {
                            "dpp-time__option--selected": minutes === selected,
                            "dpp-time__option--active": index === active
                        })}
                        onClick={() => onPick(minutes)}
                        onMouseEnter={() => setActive(index)}
                    >
                        {label(minutes)}
                    </li>
                ))}
            </ul>
        </div>
    );
}
