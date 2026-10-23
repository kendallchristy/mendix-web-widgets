import type { Big } from "big.js";
import type { EditableListValue, EditableValue, ObjectItem } from "mendix";
import type { ReactNode } from "react";

import type { ColumnsType } from "../../typings/DataGridProProps";
import { BooleanMark, Badge, Pills, Progress, type Pill } from "../components/cells";
import { resolveColor } from "./colors";
import type { ColumnModel } from "./types";

/** Related objects per row id, for each related-objects column (keyed by column id). */
export type RelatedMap = Map<string, Map<string, Pill[]>>;

export function buildColumns(columns: ColumnsType[], related: RelatedMap): ColumnModel[] {
    return columns.flatMap((column, index): ColumnModel[] => {
        if (column.visible.value === false) {
            return [];
        }
        const id = `c${index}`;
        const attribute = column.attribute;
        return [
            {
                id,
                header: column.header?.value ?? "",
                align: column.alignment,
                sortAttribute:
                    column.sortable && column.showContentAs === "attribute" && attribute?.sortable
                        ? attribute.id
                        : undefined,
                resizable: column.resizable,
                hidable: column.hidable !== "no",
                hiddenByDefault: column.hidable === "hidden",
                widthMode: column.widthMode,
                fillWeight: column.fillWeight,
                fixedWidth: column.fixedWidth,
                minWidth: column.minWidth,
                expandedWidth: column.expandedWidth,
                renderCell: cellRenderer(column, related.get(id)),
                renderExpanded: column.expandedText ? item => column.expandedText?.get(item).value : undefined,
                cellClass: item => column.columnClass?.get(item).value
            }
        ];
    });
}

function cellRenderer(column: ColumnsType, related: Map<string, Pill[]> | undefined): (item: ObjectItem) => ReactNode {
    switch (column.showContentAs) {
        case "customContent":
            return item => column.content?.get(item);
        case "related":
            return item => <Pills pills={related?.get(item.id) ?? []} />;
        case "dynamicText":
            return item => styled(column, item, column.dynamicText?.get(item).value ?? "", undefined);
        case "attribute": {
            const attribute = column.attribute;
            if (!attribute) {
                return () => null;
            }
            return item => {
                const value = attribute.get(item);
                if (value.isList) {
                    const list = value as EditableListValue<string | boolean | Date | Big>;
                    return (
                        <Pills
                            pills={list.value.map((entry, i) => {
                                const caption = attribute.formatter.format(entry as never) ?? String(entry);
                                return { key: String(i), caption, color: resolveColor(undefined, caption) };
                            })}
                        />
                    );
                }
                const single = value as EditableValue<string | boolean | Date | Big>;
                if (attribute.type === "Boolean") {
                    return <BooleanMark value={single.value === true} />;
                }
                return styled(column, item, single.displayValue, single.value);
            };
        }
    }
}

function styled(column: ColumnsType, item: ObjectItem, text: string, raw: unknown): ReactNode {
    if (column.cellStyle === "badge") {
        return text ? <Badge color={resolveColor(column.badgeColor?.get(item).value, text)}>{text}</Badge> : null;
    }
    if (column.cellStyle === "progress") {
        const numeric = typeof raw === "object" && raw !== null ? Number(raw.toString()) : Number(raw ?? text);
        return <Progress value={numeric} max={column.progressMax} />;
    }
    return <span className="dgp-text">{text}</span>;
}
