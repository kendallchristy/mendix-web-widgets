import { act, render, screen } from "@testing-library/react";

import { charts } from "../../../../shared/chart-core/src/__mocks__/echarts/core";
import { BubbleView } from "../components/BubbleView";
import { bubbleSettings } from "../model/fromProps";

describe("BubbleView", () => {
    it("draws the bubbles and runs a bubble's action on click", () => {
        const action = { canExecute: true, execute: jest.fn() };
        render(
            <BubbleView
                points={[
                    { category: "A", value: 2, drill: [], action },
                    { category: "B", value: 1, drill: [] }
                ]}
                settings={bubbleSettings({
                    aggregation: "sum",
                    drilldown: false,
                    titleAlign: "left",
                    bubbleStyle: "gradient",
                    groupOutlines: true,
                    labelContent: "nameValue",
                    valueStyle: "pill",
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
                    maxBubbles: 30,
                    bubbleGap: 3,
                    groupGap: 12,
                    decimals: -1,
                    percentDecimals: 0,
                    animationDuration: 0,
                    title: "Products"
                })}
                theme={{ preset: "hyper", palette: "theme", themeJson: [], optionOverride: [] }}
                renderer="svg"
                heightUnit="pixels"
                height={240}
                loading={false}
                emptyMessage="No data"
            />
        );
        expect(screen.getByRole("table")).toHaveTextContent("Products");
        const chart = charts[charts.length - 1];
        act(() => chart.handlers.click({ componentType: "series", seriesIndex: 0, dataIndex: 0 }));
        expect(action.execute).toHaveBeenCalled();
    });
});
