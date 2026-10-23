import type { ReactElement } from "react";

export interface ScreenReaderTableProps {
    caption: string;
    columns: string[];
    rows: string[][];
}

/**
 * The chart's data as a table that only screen readers see, so the chart never relies on colour or a canvas
 * alone. Capped so a chart with thousands of points doesn't flood the reader.
 */
export function ScreenReaderTable({ caption, columns, rows }: ScreenReaderTableProps): ReactElement {
    const shown = rows.slice(0, 500);
    return (
        <table className="hc-sr-only">
            <caption>
                {caption}
                {rows.length > shown.length ? ` (first ${shown.length} of ${rows.length} rows)` : ""}
            </caption>
            <thead>
                <tr>
                    {columns.map(column => (
                        <th key={column} scope="col">
                            {column}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {/* Rows and cells have no identity of their own and are rebuilt, never reordered. */}
                {shown.map((row, r) => (
                    // eslint-disable-next-line @eslint-react/no-array-index-key
                    <tr key={r}>
                        {row.map((cell, c) => (
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            <td key={c}>{cell}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
