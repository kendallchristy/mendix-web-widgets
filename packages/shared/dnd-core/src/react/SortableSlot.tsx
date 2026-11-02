import classNames from "classnames";
import { memo, useLayoutEffect, useRef, type CSSProperties, type ReactElement, type ReactNode } from "react";

import type { ListController } from "../engine/ListController";

export interface SortableSlotProps {
    controller: ListController;
    id: string;
    index: number;
    children: ReactNode;
    /** Screen reader name of the item. */
    label?: string;
    /** Id of the element with the keyboard instructions. */
    describedBy?: string;
    disabled?: boolean;
    className?: string;
    itemClassName?: string;
    style?: CSSProperties;
    /** For windowed lists: the index the virtualizer measures this slot by. */
    measureIndex?: number;
    measureRef?: (element: HTMLElement | null) => void;
    onClick?: () => void;
}

const INTERACTIVE = "a, button, input, textarea, select, label, [role='button'], [contenteditable='true']";

function GripIcon(): ReactElement {
    return (
        <svg viewBox="0 0 10 16" width="10" height="16" aria-hidden="true" focusable="false">
            <circle cx="2.5" cy="3" r="1.4" />
            <circle cx="7.5" cy="3" r="1.4" />
            <circle cx="2.5" cy="8" r="1.4" />
            <circle cx="7.5" cy="8" r="1.4" />
            <circle cx="2.5" cy="13" r="1.4" />
            <circle cx="7.5" cy="13" r="1.4" />
        </svg>
    );
}

/**
 * One item in a sortable list: an outer slot that stays in place (the drop target, so hit testing never moves
 * under the pointer) and an inner element that is dragged and slides out of the way.
 */
export function SortableSlot(props: SortableSlotProps): ReactElement {
    const { controller, id, index, measureRef } = props;
    const slotRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const handleRef = useRef<HTMLSpanElement>(null);
    const handleMode = controller.options.handle;

    useLayoutEffect(() => {
        if (!slotRef.current || !innerRef.current) {
            return undefined;
        }
        return controller.registerItem(id, index, slotRef.current, innerRef.current, handleRef.current);
    }, [controller, id, index, handleMode]);

    const { onClick } = props;
    return (
        <div
            ref={element => {
                slotRef.current = element;
                measureRef?.(element);
            }}
            className={classNames("kdnd-slot", props.className)}
            style={props.style}
            data-index={props.measureIndex}
            role="listitem"
        >
            <div
                ref={innerRef}
                className={classNames("kdnd-item", props.itemClassName, {
                    "kdnd-item--handle": handleMode !== "item",
                    "kdnd-item--locked": props.disabled
                })}
                tabIndex={0}
                aria-roledescription="draggable item"
                aria-label={props.label || undefined}
                aria-describedby={props.describedBy}
                aria-disabled={props.disabled || undefined}
                onKeyDown={event => {
                    if (controller.handleKeyDown(id, event.nativeEvent)) {
                        event.preventDefault();
                        event.stopPropagation();
                    } else if (event.key === "Enter" && onClick && event.target === innerRef.current) {
                        event.preventDefault();
                        onClick();
                    }
                }}
                onClick={
                    onClick
                        ? event => {
                              if (!(event.target as Element).closest(INTERACTIVE)) {
                                  onClick();
                              }
                          }
                        : undefined
                }
            >
                {handleMode === "grip" && (
                    <span ref={handleRef} className="kdnd-grip" aria-hidden="true">
                        <GripIcon />
                    </span>
                )}
                <div className="kdnd-item-content">{props.children}</div>
            </div>
        </div>
    );
}

export interface SortableRowProps extends Omit<SortableSlotProps, "children"> {
    /** Renders the item's content. Only called when the row renders. */
    renderContent(): ReactNode;
    /**
     * Changes when the content needs to render again, for example the Mendix widgets property. Rows skip
     * rendering while the list scrolls or re-sorts if nothing they show changed.
     */
    version: unknown;
    item: unknown;
}

function SortableRowInner(props: SortableRowProps): ReactElement {
    const { renderContent, version: _version, item: _item, ...slot } = props;
    return <SortableSlot {...slot}>{renderContent()}</SortableSlot>;
}

const sameRow = (a: SortableRowProps, b: SortableRowProps): boolean =>
    a.item === b.item &&
    a.version === b.version &&
    a.controller === b.controller &&
    a.id === b.id &&
    a.index === b.index &&
    a.label === b.label &&
    a.disabled === b.disabled &&
    a.describedBy === b.describedBy &&
    a.className === b.className &&
    a.itemClassName === b.itemClassName &&
    a.measureIndex === b.measureIndex &&
    a.style?.transform === b.style?.transform &&
    a.style?.width === b.style?.width &&
    (a.onClick === undefined) === (b.onClick === undefined);

/** A SortableSlot that skips rendering when nothing it shows changed, for long and windowed lists. */
export const SortableRow = memo(SortableRowInner, sameRow);
