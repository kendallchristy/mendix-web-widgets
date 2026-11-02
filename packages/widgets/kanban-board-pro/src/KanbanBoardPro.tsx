import { run } from "@kendallchristy/dnd-core";
import classNames from "classnames";
import { useCallback, useId, useState, type CSSProperties, type ReactElement } from "react";

import type { KanbanBoardProContainerProps } from "../typings/KanbanBoardProProps";
import { BoardView } from "./components/Board";
import { useBoard } from "./model/useBoard";
import "./ui/KanbanBoardPro.scss";

let instances = 0;
const DURATIONS = { normal: 200, fast: 120, off: 0 } as const;

function useCollapsed(name: string): [ReadonlySet<string>, (key: string) => void] {
    const storageKey = `kanban-board-pro:${name}:collapsed`;
    const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => {
        try {
            const stored = window.localStorage.getItem(storageKey);
            return new Set(stored ? (JSON.parse(stored) as string[]) : []);
        } catch {
            return new Set();
        }
    });
    const toggle = useCallback(
        (key: string) =>
            setCollapsed(current => {
                const next = new Set(current);
                if (!next.delete(key)) {
                    next.add(key);
                }
                try {
                    window.localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
                } catch {
                    // Storage can be off; the state still works for this page.
                }
                return next;
            }),
        [storageKey]
    );
    return [collapsed, toggle];
}

export function KanbanBoardPro(props: KanbanBoardProContainerProps): ReactElement {
    const [boardId] = useState(() => `kbp-${++instances}`);
    const instructionsId = useId();
    const model = useBoard(props, boardId);
    const [collapsed, toggle] = useCollapsed(props.name);
    const { heightMode } = props;

    const style = {
        ...props.style,
        "--kbp-column-width": `${Math.max(160, props.columnWidth || 280)}px`,
        ...(heightMode === "fixed" ? { height: `${Math.max(160, props.height || 640)}px` } : {})
    } as CSSProperties;

    return (
        <div
            className={classNames("kbp kdnd-root", `kbp--height-${heightMode}`, props.class, {
                "kdnd-indicator-line": props.indicator === "line"
            })}
            style={style}
        >
            <span id={instructionsId} className="kdnd-sr-only">
                {props.instructions?.value ?? ""}
            </span>
            {model.firstLoad ? (
                <div className="kbp-loading" aria-busy="true">
                    {[0, 1, 2].map(i => (
                        <div key={i} className="kbp-loading-column">
                            <span />
                            <span />
                        </div>
                    ))}
                </div>
            ) : (
                <BoardView
                    model={model}
                    boardId={boardId}
                    columnWidth={Math.max(160, props.columnWidth || 280)}
                    collapsed={collapsed}
                    onToggle={toggle}
                    settings={{
                        indicator: props.indicator,
                        preview: props.preview,
                        duration: DURATIONS[props.animation],
                        scrolls: heightMode !== "auto",
                        collapsible: props.collapsible,
                        showCount: props.showCount,
                        emptyText: props.emptyColumnText?.value ?? "",
                        describedBy: instructionsId,
                        cardStyle: props.cardStyle,
                        renderCard: card => props.cardContent.get(card),
                        version: props.cardContent,
                        renderHeader:
                            props.columnHeader && props.columnSource === "datasource"
                                ? column => (column.item ? props.columnHeader!.get(column.item) : null)
                                : undefined,
                        renderFooter:
                            props.columnFooter && props.columnSource === "datasource"
                                ? column => (column.item ? props.columnFooter!.get(column.item) : null)
                                : undefined,
                        onCardClick: props.onCardClick ? card => run(props.onCardClick!.get(card)) : undefined,
                        clickable: props.onCardClick !== undefined
                    }}
                />
            )}
        </div>
    );
}
