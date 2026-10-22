import { act, fireEvent, render, screen } from "@testing-library/react";

import { charts } from "../../../../shared/chart-core/src/__mocks__/echarts/core";
import { ChartView } from "../components/ChartView";
import type { ChartViewProps } from "../components/ChartView";
import { series, settings } from "./helpers";

function view(overrides: Partial<ChartViewProps> = {}): ChartViewProps {
    return {
        series: [series("Sales", [{ x: "Jan", y: 1 }])],
        settings: settings(),
        theme: { preset: "hyper", palette: "theme", themeJson: [], optionOverride: [] },
        renderer: "svg",
        heightUnit: "pixels",
        height: 200,
        loading: false,
        emptyMessage: "Nothing yet",
        ...overrides
    };
}

const lastChart = () => charts[charts.length - 1];
// ECharts options are loosely typed JSON; the tests read into them freely.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lastOption = () => lastChart().options[lastChart().options.length - 1] as Record<string, any>;

describe("ChartView", () => {
    it("draws the chart at the configured height", () => {
        const { container } = render(<ChartView {...view()} />);
        expect(container.querySelector(".hc-chart")).toHaveStyle({ height: "200px" });
        expect(lastOption().series[0].name).toBe("Sales");
    });

    it("shows the empty message, the loading state and JSON errors", () => {
        const { rerender } = render(<ChartView {...view({ series: [] })} />);
        expect(screen.getByText("Nothing yet")).toBeInTheDocument();

        rerender(<ChartView {...view({ loading: true })} />);
        expect(screen.getByLabelText("Loading chart")).toBeInTheDocument();

        rerender(
            <ChartView
                {...view({ theme: { preset: "custom", palette: "theme", themeJson: ["{bad"], optionOverride: [] } })}
            />
        );
        expect(screen.getByRole("alert")).toHaveTextContent("Theme JSON");
    });

    it("merges the option override last", () => {
        render(
            <ChartView
                {...view({
                    theme: {
                        preset: "hyper",
                        palette: "theme",
                        themeJson: [],
                        optionOverride: ['{"series": [{"smooth": false}]}']
                    }
                })}
            />
        );
        expect(lastOption().series[0]).toMatchObject({ name: "Sales", smooth: false });
    });

    it("uses a custom theme's colours for the series", () => {
        render(
            <ChartView
                {...view({
                    theme: {
                        preset: "custom",
                        palette: "theme",
                        themeJson: ['{"color": ["#abcdef"]}'],
                        optionOverride: []
                    }
                })}
            />
        );
        expect(lastOption().series[0].color).toBe("#abcdef");
        expect((lastChart().theme as Record<string, unknown>).color).toEqual(["#abcdef"]);
    });

    it("drills down on click and back up from the breadcrumb", () => {
        const points = [
            { x: "Europe", y: 1, drill: ["France", undefined] },
            { x: "Asia", y: 2, drill: ["Japan", undefined] }
        ];
        render(
            <ChartView
                {...view({
                    series: [series("S", points)],
                    settings: settings({ drill: { kind: "category" }, topLabel: "World" })
                })}
            />
        );
        act(() => lastChart().handlers.click({ componentType: "series", seriesIndex: 0, dataIndex: 0 }));
        expect(lastOption().xAxis.data).toEqual(["France"]);

        fireEvent.click(screen.getByRole("button", { name: "World" }));
        expect(lastOption().xAxis.data).toEqual(["Europe", "Asia"]);
    });

    it("runs the click action when there is nothing to drill into", () => {
        const execute = jest.fn();
        render(
            <ChartView
                {...view({ series: [series("S", [{ x: "A", y: 1, action: { canExecute: true, execute } }])] })}
            />
        );
        act(() => lastChart().handlers.click({ componentType: "series", seriesIndex: 0, dataIndex: 0 }));
        expect(execute).toHaveBeenCalled();
    });

    it("re-themes when the page's dark-mode class changes", async () => {
        const { container } = render(<ChartView {...view()} />);
        const chart = lastChart();
        (container.querySelector(".hc-chart") as HTMLElement).style.setProperty("--hc-mode", "dark");
        await act(async () => {
            document.documentElement.classList.add("dark");
            await Promise.resolve();
        });
        expect((chart.theme as Record<string, unknown>).backgroundColor).toBe("transparent");
        expect(lastOption().series[0].color).toBe("#9458E8");
        document.documentElement.classList.remove("dark");
    });
});
