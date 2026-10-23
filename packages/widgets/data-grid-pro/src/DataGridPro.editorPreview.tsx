import classNames from "classnames";
import type { ReactElement } from "react";

import type { ColumnsPreviewType, DataGridProPreviewProps } from "../typings/DataGridProProps";

const PREVIEW_ROWS = 4;

function columnTrack(column: ColumnsPreviewType): string {
    return column.widthMode === "fixed"
        ? `${column.fixedWidth ?? 120}px`
        : `minmax(${column.minWidth ?? 80}px, ${Math.max(column.fillWeight ?? 1, 1)}fr)`;
}

function cellText(column: ColumnsPreviewType): string {
    switch (column.showContentAs) {
        case "dynamicText":
            return column.dynamicText || "Dynamic text";
        case "related":
            return column.relatedCaption ? `[${column.relatedCaption}]` : "[Related objects]";
        default:
            return column.attribute ? `[${column.attribute}]` : "[No attribute]";
    }
}

/** Design mode preview in Studio Pro, with drop zones for every widget slot. */
export function preview(props: DataGridProPreviewProps): ReactElement {
    const columns = props.columns.length > 0 ? props.columns : undefined;
    const template = columns ? columns.map(columnTrack).join(" ") : "1fr";
    const style = { "--dgp-columns": template, "--dgp-min-width": "0px", "--dgp-row-height": "40px" } as never;
    return (
        <div className={classNames("dgp", `dgp--${props.density}`, props.class)} style={style}>
            <div className="dgp-toolbar">
                <div className="dgp-title">
                    <h2 className="dgp-title-text">{props.title || "Data Grid Pro"}</h2>
                    {props.showCount && <span className="dgp-count">123</span>}
                </div>
                <props.toolbarContent.renderer caption="Toolbar: place filters and buttons here">
                    <div className="dgp-toolbar-content" />
                </props.toolbarContent.renderer>
            </div>
            <div className="dgp-scroll">
                <div className="dgp-head" style={{ position: "static" }}>
                    <div className="dgp-cells">
                        {(columns ?? []).map((column, i) => (
                            <div key={i} className={`dgp-hcell dgp-cell--${column.alignment}`}>
                                {column.header || "Column"}
                            </div>
                        ))}
                    </div>
                </div>
                {Array.from({ length: PREVIEW_ROWS }, (_, row) => (
                    <div key={row} className="dgp-row" style={{ position: "static" }}>
                        <div className="dgp-cells">
                            {(columns ?? []).map((column, i) => (
                                <div key={i} className={`dgp-cell dgp-cell--${column.alignment}`}>
                                    {column.showContentAs === "customContent" ? (
                                        <column.content.renderer caption="Custom content">
                                            <div style={{ flexGrow: 1 }} />
                                        </column.content.renderer>
                                    ) : (
                                        <span className="dgp-text">{cellText(column)}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <props.detailContent.renderer caption="Row details: place widgets here to make rows expandable">
                <div className="dgp-detail" />
            </props.detailContent.renderer>
            <props.bulkActions.renderer caption="Bulk actions: shown while rows are selected">
                <div className="dgp-toolbar-content" />
            </props.bulkActions.renderer>
            <props.emptyPlaceholder.renderer caption="Empty message: place widgets here">
                <div className="dgp-empty-text" />
            </props.emptyPlaceholder.renderer>
        </div>
    );
}

export function getPreviewCss(): string {
    // The widget build turns this stylesheet into a string for Studio Pro.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("./ui/DataGridPro.scss");
}
