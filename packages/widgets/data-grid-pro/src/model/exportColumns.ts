import type { Big } from "big.js";
import type { EditableListValue, EditableValue, ObjectItem } from "mendix";

import type { ColumnsType } from "../../typings/DataGridProProps";
import type { CellValue } from "./xlsx";

const NUMBER_TYPES = new Set(["AutoNumber", "Decimal", "Integer", "Long"]);

/** Whether a column has something to put in an export: an export value, an attribute or dynamic text. */
export function isExportable(column: ColumnsType): boolean {
    return (
        column.exportValue !== undefined ||
        (column.showContentAs === "attribute" && column.attribute !== undefined) ||
        (column.showContentAs === "dynamicText" && column.dynamicText !== undefined)
    );
}

/**
 * One cell of an export. Attribute values keep their type, so numbers, dates and booleans stay numbers, dates
 * and booleans in Excel; enumerations export their caption.
 */
export function exportValue(column: ColumnsType, item: ObjectItem): CellValue {
    if (column.exportValue) {
        return column.exportValue.get(item).value;
    }
    if (column.showContentAs === "dynamicText") {
        return column.dynamicText?.get(item).value;
    }
    const attribute = column.attribute;
    if (column.showContentAs !== "attribute" || !attribute) {
        return undefined;
    }
    const value = attribute.get(item);
    if (value.isList) {
        const list = value as EditableListValue<string | boolean | Date | Big>;
        return list.value.map(entry => attribute.formatter.format(entry as never) ?? String(entry)).join(", ");
    }
    const single = value as EditableValue<string | boolean | Date | Big>;
    const raw = single.value;
    if (raw === undefined) {
        return undefined;
    }
    if (attribute.type === "Boolean" || attribute.type === "DateTime") {
        return raw as boolean | Date;
    }
    if (NUMBER_TYPES.has(attribute.type)) {
        return Number(raw.toString());
    }
    if (attribute.type === "String" || attribute.type === "HashString") {
        return raw as string;
    }
    return single.displayValue;
}

/** A file name without characters that file systems reject, ending in .xlsx. */
export function exportFileName(name: string | undefined): string {
    const clean =
        (name ?? "")
            .replace(/[\\/:*?"<>|]+/g, " ")
            .replace(/\s+/g, " ")
            .trim() || "Export";
    return clean.toLowerCase().endsWith(".xlsx") ? clean : `${clean}.xlsx`;
}

export function download(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Give the browser time to start the download before the URL goes away.
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}
