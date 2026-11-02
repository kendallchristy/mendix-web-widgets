import {
    hideNestedPropertiesIn,
    hidePropertiesIn,
    hidePropertyIn,
    type Properties
} from "@mendix/pluggable-widgets-tools";

import type { ColumnsPreviewType, DataGridProPreviewProps } from "../typings/DataGridProProps";
import { container, dropzone, rowLayout, selectable, text, type StructurePreviewProps } from "./preview/structure";

type ColumnKey = keyof ColumnsPreviewType;

const RELATED_KEYS: ColumnKey[] = ["relatedSource", "relatedParent", "relatedCaption", "relatedColor"];

/** Hides properties that don't apply to the current configuration in Studio Pro. */
export function getProperties(values: DataGridProPreviewProps, defaultProperties: Properties): Properties {
    values.columns.forEach((column, index) => {
        const hide: ColumnKey[] = [];
        if (column.showContentAs !== "attribute") {
            hide.push("attribute");
        }
        if (column.showContentAs !== "dynamicText") {
            hide.push("dynamicText");
        }
        if (column.showContentAs !== "customContent") {
            hide.push("content");
        }
        if (column.showContentAs !== "related") {
            hide.push(...RELATED_KEYS);
        }
        if (column.showContentAs === "customContent" || column.showContentAs === "related") {
            hide.push("cellStyle", "badgeColor", "progressMax");
        } else {
            if (column.cellStyle !== "badge") {
                hide.push("badgeColor");
            }
            if (column.cellStyle !== "progress") {
                hide.push("progressMax");
            }
        }
        if (column.showContentAs !== "attribute") {
            hide.push("sortable");
        }
        if (column.widthMode === "fixed") {
            hide.push("fillWeight", "minWidth");
        } else {
            hide.push("fixedWidth");
        }
        hideNestedPropertiesIn(defaultProperties, values, "columns", index, hide);
    });

    if (values.onClick === null) {
        hidePropertyIn(defaultProperties, values, "onClickTrigger");
    }
    if (values.detailContent.widgetCount === 0) {
        hidePropertiesIn(defaultProperties, values, ["expandTrigger", "singleExpand"]);
    }
    if (values.itemSelection === "None") {
        hidePropertiesIn(defaultProperties, values, [
            "onSelectionChange",
            "keepSelection",
            "clearAfterBulkAction",
            "bulkActions"
        ]);
    } else if (values.bulkActions.widgetCount === 0) {
        hidePropertyIn(defaultProperties, values, "clearAfterBulkAction");
    }
    if (values.pagination === "pages") {
        hidePropertyIn(defaultProperties, values, "heightMode");
    }
    if (values.heightMode === "fill" && values.pagination === "virtualScrolling") {
        hidePropertyIn(defaultProperties, values, "height");
    }
    if (values.configurationStorage !== "attribute") {
        hidePropertyIn(defaultProperties, values, "configurationAttribute");
    }
    return defaultProperties;
}

interface Problem {
    property?: string;
    severity?: "error" | "warning" | "deprecation";
    message: string;
}

/** Configuration errors shown in Studio Pro's error list. */
export function check(values: DataGridProPreviewProps): Problem[] {
    const problems: Problem[] = [];
    values.columns.forEach((column, index) => {
        const property = `columns/${index + 1}`;
        if (column.showContentAs === "attribute" && !column.attribute) {
            problems.push({ property: `${property}/attribute`, message: "Select an attribute for this column." });
        }
        if (column.showContentAs === "related") {
            if (!column.relatedSource) {
                problems.push({ property: `${property}/relatedSource`, message: "Select the related data source." });
            }
            if (!column.relatedParent) {
                problems.push({
                    property: `${property}/relatedParent`,
                    message: "Select the association from the related object to the row."
                });
            }
        }
    });
    if (values.configurationStorage === "attribute" && !values.configurationAttribute) {
        problems.push({
            property: "configurationAttribute",
            message: "Select an attribute to store user settings in, or store them in the browser."
        });
    }
    if (
        values.detailContent.widgetCount > 0 &&
        values.expandTrigger === "row" &&
        values.onClick !== null &&
        values.onClickTrigger === "single"
    ) {
        problems.push({
            property: "expandTrigger",
            severity: "warning",
            message:
                "A single click both expands the row and runs the on click action. Use a double click trigger for the action to keep them apart."
        });
    }
    if ((values.pageSize ?? 0) < 1) {
        problems.push({ property: "pageSize", message: "Page size must be at least 1." });
    }
    return problems;
}

/** Structure mode preview in Studio Pro. */
export function getPreview(values: DataGridProPreviewProps): StructurePreviewProps {
    const muted = { fontSize: 10, fontColor: "#6B7280" };
    const header = rowLayout({ columnSize: "fixed" })(
        ...values.columns.map(column =>
            selectable(column, { grow: column.widthMode === "fixed" ? 0 : Math.max(column.fillWeight ?? 1, 1) })(
                container({ borders: true, padding: 8 })(text({ bold: true, fontSize: 10 })(column.header || "Column"))
            )
        )
    );
    const row = rowLayout({ columnSize: "fixed" })(
        ...values.columns.map(column =>
            container({ borders: true, grow: column.widthMode === "fixed" ? 0 : Math.max(column.fillWeight ?? 1, 1) })(
                column.showContentAs === "customContent"
                    ? dropzone("Custom content")(column.content)
                    : container({ padding: 8 })(text(muted)(column.attribute || column.dynamicText || "Value"))
            )
        )
    );
    return container()(
        rowLayout({ columnSize: "grow", backgroundColor: "#F3F4F6", borders: true })(
            container({ padding: 6 })(text({ bold: true })(values.title || "Data Grid Pro"))
        ),
        dropzone("Toolbar: place filters and buttons here")(values.toolbarContent),
        header,
        row,
        row,
        row,
        dropzone("Row details: place widgets here to make rows expandable")(values.detailContent),
        ...(values.itemSelection !== "None"
            ? [dropzone("Bulk actions: buttons here can pass the grid's selection to a microflow")(values.bulkActions)]
            : []),
        dropzone("Empty message")(values.emptyPlaceholder)
    );
}
