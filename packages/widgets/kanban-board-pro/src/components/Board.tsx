import { SortableSlot, useListController } from "@kendallchristy/dnd-core";
import classNames from "classnames";
import { useLayoutEffect, useState, type ReactElement } from "react";

import type { Board as BoardModel } from "../model/useBoard";
import { ColumnBody, type ColumnSettings } from "./Column";

export interface BoardProps {
    model: BoardModel;
    settings: Omit<ColumnSettings, "board" | "scope" | "handle">;
    boardId: string;
    columnWidth: number;
    collapsed: ReadonlySet<string>;
    onToggle(column: string): void;
}

/** The row of columns. Columns are themselves a sortable list, dragged by their headers. */
export function BoardView(props: BoardProps): ReactElement {
    const { model, settings, boardId } = props;
    const [rowElement, setRowElement] = useState<HTMLDivElement | null>(null);
    const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);

    const columnsController = useListController(model.columnListId, {
        scope: `${boardId}:columns`,
        axis: "horizontal",
        handle: "custom",
        indicator: settings.indicator,
        preview: settings.preview,
        duration: settings.duration,
        getIds: () => model.columns.map(column => column.key),
        canDragItem: () => model.canReorderColumns,
        canReceive: () => false,
        onDrop: model.moveColumn,
        describe: (event, id, position, count) => model.describeColumn(event, id, position, count)
    });

    useLayoutEffect(() => {
        columnsController.setContainer(rowElement, scrollElement);
    }, [columnsController, rowElement, scrollElement]);

    const columnSettings: ColumnSettings = {
        ...settings,
        board: model,
        scope: `${boardId}:cards`,
        handle: "item"
    };

    return (
        <div ref={setScrollElement} className="kbp-board-scroll">
            <div ref={setRowElement} className="kbp-columns kdnd-list" role="list">
                {model.columns.map((column, index) => {
                    const collapsed = props.collapsed.has(column.key);
                    return (
                        <SortableSlot
                            key={column.key}
                            controller={columnsController}
                            id={column.key}
                            index={index}
                            label={column.title}
                            disabled={!model.canReorderColumns}
                            className={classNames("kbp-column-slot", { "kbp-column-slot--collapsed": collapsed })}
                            itemClassName={classNames("kbp-column", { "kbp-column--collapsed": collapsed })}
                            style={collapsed ? undefined : { width: props.columnWidth }}
                        >
                            <ColumnBody
                                column={column}
                                previous={index > 0 ? model.cardListId(model.columns[index - 1].key) : undefined}
                                next={
                                    index < model.columns.length - 1
                                        ? model.cardListId(model.columns[index + 1].key)
                                        : undefined
                                }
                                settings={columnSettings}
                                collapsed={collapsed}
                                onToggle={() => props.onToggle(column.key)}
                            />
                        </SortableSlot>
                    );
                })}
            </div>
        </div>
    );
}
