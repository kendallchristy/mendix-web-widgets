import type { ChartStyle, ClickAction } from "@kendallchristy/chart-core";

/** One field of a row, as ECharts takes it: dates stay dates, Mendix decimals become numbers. */
export type Cell = string | number | boolean | Date | null;

/** The rows of one data set, ready to hand to ECharts. */
export interface DataSet {
    name: string;
    fields: string[];
    rows: Array<Record<string, Cell>>;
    /** The action for each row's object, read only when a row is clicked. */
    actionOf: (row: number) => ClickAction | undefined;
}

export interface CustomSettings {
    title?: string;
    subtitle?: string;
    titleAlign: "left" | "center";
    /** Option JSON texts, merged in order. */
    optionJson: Array<string | undefined>;
    style: ChartStyle;
}
