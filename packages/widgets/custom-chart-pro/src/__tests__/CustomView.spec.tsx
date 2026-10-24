import { act, render, screen } from "@testing-library/react";

import { charts } from "../../../../shared/chart-core/src/__mocks__/echarts/core";
import { CustomView } from "../components/CustomView";
import { customSettings } from "../model/fromProps";
import type { DataSet } from "../model/types";

const base = {
    titleAlign: "left",
    figuresFont: "mono",
    animation: false,
    animationDuration: 0,
    background: "transparent"
} as const;

function view(dataSets: DataSet[], optionJson: string, mapError?: string): void {
    render(
        <CustomView
            dataSets={dataSets}
            settings={customSettings({ ...base, title: "Flows", optionJson: [optionJson] })}
            theme={{ preset: "hyper", palette: "theme", themeJson: [], optionOverride: [] }}
            renderer="svg"
            heightUnit="pixels"
            height={240}
            loading={false}
            mapError={mapError}
            emptyMessage="No data"
        />
    );
}

describe("CustomView", () => {
    it("draws the option and runs a row's action on click", () => {
        const execute = jest.fn();
        const set: DataSet = {
            name: "Sales",
            fields: ["month", "value"],
            rows: [
                { month: "Jan", value: 3 },
                { month: "Feb", value: 5 }
            ],
            actionOf: row => (row === 1 ? { canExecute: true, execute } : undefined)
        };
        view([set], JSON.stringify({ series: { type: "bar", datasetId: "Sales" } }));
        expect(screen.getByRole("table")).toHaveTextContent("Feb");
        const chart = charts[charts.length - 1];
        act(() => chart.handlers.click({ componentType: "series", seriesIndex: 0, dataIndex: 1 }));
        expect(execute).toHaveBeenCalled();
    });

    it("shows problems instead of the chart", () => {
        view([], "{}", "The map didn't load.");
        expect(screen.getByText(/The map didn't load\./)).toBeInTheDocument();
    });
});
