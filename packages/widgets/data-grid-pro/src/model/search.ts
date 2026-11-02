import { Big } from "big.js";
import type { FilterCondition } from "mendix/filters";
import { and, attribute, contains, empty, equals, literal, notEqual, or } from "mendix/filters/builders";

import type { ColumnsType } from "../../typings/DataGridProProps";

const NUMBER_TYPES = new Set(["AutoNumber", "Decimal", "Integer", "Long"]);

/** Whether the search box can look in this column. */
export function isSearchable(column: ColumnsType): boolean {
    const attr = column.attribute;
    return (
        column.searchable &&
        column.showContentAs === "attribute" &&
        column.visible.value !== false &&
        attr !== undefined &&
        attr.filterable &&
        !attr.isList &&
        (attr.type === "String" || attr.type === "HashString" || attr.type === "Enum" || NUMBER_TYPES.has(attr.type))
    );
}

function parseNumber(text: string): Big | undefined {
    try {
        return new Big(text.replace(/[\s,]/g, ""));
    } catch {
        return undefined;
    }
}

/**
 * One condition for the toolbar search box: rows where any searchable column matches. Text columns match when
 * they contain the text, ignoring case. Enumeration columns match on their captions, and number columns match
 * when the text is that number.
 */
export function searchFilter(columns: ColumnsType[], text: string): FilterCondition | undefined {
    const query = text.trim();
    if (!query) {
        return undefined;
    }
    const lower = query.toLowerCase();
    const parts: FilterCondition[] = [];
    let anyId: ReturnType<typeof attribute> | undefined;
    for (const column of columns) {
        const attr = column.attribute;
        if (!attr || !isSearchable(column)) {
            continue;
        }
        const id = attribute(attr.id);
        anyId ??= id;
        if (attr.type === "String" || attr.type === "HashString") {
            parts.push(contains(id, literal(query)));
        } else if (attr.type === "Enum") {
            for (const key of attr.universe ?? []) {
                const caption = attr.formatter.format(key as never) ?? String(key);
                if (caption.toLowerCase().includes(lower)) {
                    parts.push(equals(id, literal(key as string)));
                }
            }
        } else {
            const number = parseNumber(query);
            if (number) {
                parts.push(equals(id, literal(number)));
            }
        }
    }
    if (!anyId) {
        return undefined;
    }
    if (parts.length === 0) {
        // Nothing can match, for example letters typed while only number columns are searchable.
        return and(equals(anyId, empty()), notEqual(anyId, empty()));
    }
    return parts.length === 1 ? parts[0] : or(...parts);
}
