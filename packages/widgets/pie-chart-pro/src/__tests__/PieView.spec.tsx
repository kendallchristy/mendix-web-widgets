import { act, render, screen } from "@testing-library/react";

import { charts } from "../../../../shared/chart-core/src/__mocks__/echarts/core";
import { PieView } from "../components/PieView";
import { pieSettings } from "../model/fromProps";

describe("PieView", () => {
    it("draws the slices and runs a slice's action on click", () => {
        const action = { canExecute: true, execute: jest.fn() };
        render(
            <PieView
                points={[
                    { category: "A", value: 2, drill: [], action },
                    { category: "B", value: 1, drill: [] }
                ]}
                settings={pieSettings({
                    aggregation: "sum",
                    sortOrder: "valueDesc",
                    drilldown: false,
                    titleAlign: "left",
                    shape: "donut",
                    rose: "off",
                    labelPosition: "outside",
                    labelContent: "namePercent",
                    centerContent: "total",
                    prefix: "",
                    suffix: "",
                    thousandsSeparator: true,
                    compactNumbers: false,
                    glow: "soft",
                    legend: "auto",
                    tooltip: "card",
                    figuresFont: "mono",
                    animation: false,
                    background: "transparent",
                    maxSlices: 6,
                    innerRadius: 60,
                    cornerRadius: 4,
                    sliceGap: 2,
                    startAngle: 90,
                    decimals: -1,
                    percentDecimals: 0,
                    animationDuration: 0,
                    title: "Traffic"
                })}
                theme={{ preset: "hyper", palette: "theme", themeJson: [], optionOverride: [] }}
                renderer="svg"
                heightUnit="pixels"
                height={240}
                loading={false}
                emptyMessage="No data"
            />
        );
        expect(screen.getByRole("table")).toHaveTextContent("Traffic");
        const chart = charts[charts.length - 1];
        act(() => chart.handlers.click({ componentType: "series", seriesIndex: 0, dataIndex: 0 }));
        expect(action.execute).toHaveBeenCalled();
    });
});
