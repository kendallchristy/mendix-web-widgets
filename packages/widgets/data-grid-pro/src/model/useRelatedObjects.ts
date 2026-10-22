import type { ObjectItem } from "mendix";
import { association, contains, equals, literal, or } from "mendix/filters/builders";
import { useEffect, useMemo } from "react";

import type { ColumnsType } from "../../typings/DataGridProProps";
import type { Pill } from "../components/cells";
import { resolveColor } from "./colors";
import type { RelatedMap } from "./columns";

/**
 * Loads the objects for every "Related objects" column with one request per column for all loaded rows,
 * instead of one request per cell. Each related data source is filtered to objects whose association points
 * at a loaded row, then grouped by row.
 */
export function useRelatedObjects(columns: ColumnsType[], rows: ObjectItem[]): RelatedMap {
    // Changes only when the set of loaded rows changes, not on every re-render.
    const rowKey = rows.map(row => row.id).join(",");

    useEffect(() => {
        if (rows.length === 0) {
            return;
        }
        // Let a burst of scroll-driven window moves settle before refiltering.
        const timer = setTimeout(() => {
            for (const column of columns) {
                const source = column.relatedSource;
                const parent = column.relatedParent;
                if (column.showContentAs !== "related" || !source || !parent?.filterable) {
                    continue;
                }
                const id = association(parent.id);
                const matchesRow = (row: ObjectItem) =>
                    parent.type === "Reference" ? equals(id, literal(row)) : contains(id, literal(row));
                source.setFilter(rows.length === 1 ? matchesRow(rows[0]) : or(...rows.map(matchesRow)));
            }
        }, 100);
        return () => clearTimeout(timer);
        // rowKey stands in for rows; columns change identity on every Mendix update.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rowKey]);

    return useMemo(() => {
        const map: RelatedMap = new Map();
        columns.forEach((column, index) => {
            const source = column.relatedSource;
            const parent = column.relatedParent;
            if (column.showContentAs !== "related" || !source?.items || !parent) {
                return;
            }
            const byRow = new Map<string, Pill[]>();
            for (const related of source.items) {
                const caption = column.relatedCaption?.get(related).value ?? "";
                const pill: Pill = {
                    key: related.id,
                    caption,
                    color: resolveColor(column.relatedColor?.get(related).value, caption)
                };
                const owners = parent.get(related).value;
                for (const owner of Array.isArray(owners) ? owners : owners ? [owners] : []) {
                    const list = byRow.get(owner.id);
                    if (list) {
                        list.push(pill);
                    } else {
                        byRow.set(owner.id, [pill]);
                    }
                }
            }
            map.set(`c${index}`, byRow);
        });
        return map;
    }, [columns]);
}
