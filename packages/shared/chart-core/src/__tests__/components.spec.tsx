import { act, fireEvent, render, screen } from "@testing-library/react";

import { Breadcrumb } from "../components/Breadcrumb";
import type { BuiltChart, ChartFrameProps } from "../components/ChartFrame";
import { ChartFrame, themeSettingsFromProps } from "../components/ChartFrame";
import type { DrillStep } from "../hooks/useDrillPath";
import { defaultChartStyle } from "../options/style";
import { EChart } from "../components/EChart";
import { charts, failures } from "../__mocks__/echarts/core";

describe("Breadcrumb", () => {
    it("is hidden at the top level", () => {
        const { container } = render(<Breadcrumb items={["All"]} onNavigate={jest.fn()} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("navigates back to an earlier level", () => {
        const onNavigate = jest.fn();
        render(<Breadcrumb items={["All", "2026", "Q3"]} onNavigate={onNavigate} />);
        fireEvent.click(screen.getByRole("button", { name: "2026" }));
        expect(onNavigate).toHaveBeenCalledWith(1);
        expect(screen.getByText("Q3")).toHaveAttribute("aria-current", "page");
    });
});

describe("EChart", () => {
    it("applies new options and themes to the same chart", () => {
        const onClick = jest.fn();
        const { rerender } = render(<EChart option={{ a: 1 }} theme={{ t: 1 }} renderer="svg" onClick={onClick} />);
        const chart = charts[charts.length - 1];
        expect(chart.options).toEqual([{ a: 1 }]);

        rerender(<EChart option={{ a: 2 }} theme={{ t: 2 }} renderer="svg" onClick={onClick} />);
        expect(charts[charts.length - 1]).toBe(chart);
        expect(chart.options).toEqual([{ a: 1 }, { a: 2 }]);
        expect(chart.theme).toEqual({ t: 2 });

        chart.handlers.click({ componentType: "series", dataIndex: 0 });
        expect(onClick).toHaveBeenCalled();
    });

    it("starts a fresh chart when an update fails, and reports an option that fails even then", () => {
        const onClick = jest.fn();
        const onError = jest.fn();
        const { rerender } = render(
            <EChart option={{ a: 1 }} theme={{}} renderer="svg" onClick={onClick} onError={onError} />
        );
        const first = charts[charts.length - 1];

        failures.count = 1;
        rerender(<EChart option={{ a: 2 }} theme={{}} renderer="svg" onClick={onClick} onError={onError} />);
        const fresh = charts[charts.length - 1];
        expect(first.disposed).toBe(true);
        expect(fresh).not.toBe(first);
        expect(fresh.options).toEqual([{ a: 2 }]);
        expect(onError).toHaveBeenLastCalledWith(undefined, { a: 2 });
        fresh.handlers.click({ componentType: "series", dataIndex: 0 });
        expect(onClick).toHaveBeenCalled();

        failures.count = 2;
        rerender(<EChart option={{ a: 3 }} theme={{}} renderer="svg" onClick={onClick} onError={onError} />);
        expect(onError).toHaveBeenLastCalledWith("Cannot read properties of undefined (reading 'get')", { a: 3 });
    });

    it("puts the current option back after a theme change", () => {
        const { rerender } = render(<EChart option={{ a: 1 }} theme={{ t: 1 }} renderer="svg" />);
        const chart = charts[charts.length - 1];
        rerender(<EChart option={{ a: 2 }} theme={{ t: 1 }} renderer="svg" />);
        rerender(<EChart option={{ a: 2 }} theme={{ t: 2 }} renderer="svg" />);
        expect(chart.theme).toEqual({ t: 2 });
        expect(chart.options.at(-1)).toEqual({ a: 2 });
    });
});

describe("ChartFrame", () => {
    const action = { canExecute: true, execute: jest.fn() };
    const build = jest.fn((_tokens: unknown, path: Array<DrillStep<string>>): BuiltChart<string> => ({
        option: { series: [{ name: path.map(s => s.value).join("/") || "top" }] },
        clickTargets: [[path.length === 0 ? { drill: { label: "Europe", value: "Europe" } } : { action }]],
        breadcrumb: ["All", ...path.map(s => s.label)],
        table: { columns: ["Name"], rows: [["Europe"]] },
        pointCount: 1
    }));
    const props = (overrides: Partial<ChartFrameProps<string>> = {}): ChartFrameProps<string> => ({
        widgetClass: "widget-test",
        build,
        theme: { preset: "hyper", palette: "theme", themeJson: [], optionOverride: [] },
        chartStyle: defaultChartStyle,
        caption: "Test data",
        renderer: "svg",
        heightUnit: "pixels",
        height: 180,
        loading: false,
        emptyMessage: "Empty",
        ...overrides
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lastOption = () => charts[charts.length - 1].options.at(-1) as Record<string, any>;

    it("drills down on click, then runs the action at the last level", () => {
        render(<ChartFrame {...props()} />);
        expect(screen.getByRole("table")).toHaveTextContent("Test data");
        const chart = charts[charts.length - 1];
        act(() => chart.handlers.click({ componentType: "series", seriesIndex: 0, dataIndex: 0 }));
        expect(lastOption().series[0].name).toBe("Europe");
        expect(screen.getByRole("navigation", { name: "Drilldown" })).toHaveTextContent("Europe");

        act(() => chart.handlers.click({ componentType: "series", seriesIndex: 0, dataIndex: 0 }));
        expect(action.execute).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole("button", { name: "All" }));
        expect(lastOption().series[0].name).toBe("top");
    });

    it("merges the option override and reports bad JSON", () => {
        const { rerender } = render(
            <ChartFrame
                {...props({
                    theme: { preset: "hyper", palette: "theme", themeJson: [], optionOverride: ['{"color": ["#000"]}'] }
                })}
            />
        );
        expect(lastOption().color).toEqual(["#000"]);
        rerender(
            <ChartFrame
                {...props({ theme: { preset: "hyper", palette: "theme", themeJson: [], optionOverride: ["{"] } })}
            />
        );
        expect(screen.getByRole("alert")).toHaveTextContent("Option override");
    });

    it("shows ECharts' error for an option it can't draw, and tries the next option afresh", () => {
        failures.count = 1;
        const { rerender } = render(<ChartFrame {...props()} />);
        expect(screen.getByText(/The chart couldn't be drawn: Cannot read properties/)).toBeInTheDocument();
        const other = jest.fn((): BuiltChart<string> => ({ ...build({}, []), option: { series: [] } }));
        rerender(<ChartFrame {...props({ build: other })} />);
        expect(screen.queryByText(/couldn't be drawn/)).not.toBeInTheDocument();
    });

    it("shows loading and empty states", () => {
        const { rerender } = render(<ChartFrame {...props({ loading: true })} />);
        expect(screen.getByLabelText("Loading chart")).toBeInTheDocument();
        rerender(<ChartFrame {...props({ build: () => ({ ...build({}, []), pointCount: 0 }) })} />);
        expect(screen.getByText("Empty")).toBeInTheDocument();
    });

    it("puts the title above the plot, using the theme's title colours", () => {
        const { container } = render(
            <ChartFrame
                {...props({
                    title: "Revenue",
                    subtitle: "Per month",
                    titleAlign: "center",
                    theme: {
                        preset: "custom",
                        palette: "theme",
                        themeJson: ['{"title": {"textStyle": {"color": "#123456"}}}'],
                        optionOverride: []
                    }
                })}
            />
        );
        const header = container.querySelector(".hc-chart__header--center")!;
        expect(header).toHaveTextContent("RevenuePer month");
        expect(screen.getByText("Revenue")).toHaveStyle({ color: "#123456" });
        expect(header.nextElementSibling).toHaveClass("hc-chart__body");
    });

    it("waits for data, then keeps the last chart while it reloads", () => {
        build.mockClear();
        const { rerender } = render(<ChartFrame {...props({ loading: true })} />);
        expect(build).not.toHaveBeenCalled();
        expect(screen.getByLabelText("Loading chart")).toBeInTheDocument();

        rerender(<ChartFrame {...props()} />);
        expect(build).toHaveBeenCalledTimes(1);
        expect(screen.queryByLabelText("Loading chart")).not.toBeInTheDocument();

        rerender(<ChartFrame {...props({ loading: true })} />);
        expect(build).toHaveBeenCalledTimes(1);
        expect(screen.getByLabelText("Updating chart")).toBeInTheDocument();
        expect(screen.getByRole("table")).toBeInTheDocument();
    });

    it("reads theme settings from widget properties", () => {
        expect(
            themeSettingsFromProps({
                theme: "custom",
                palette: "custom",
                customPalette: "#111",
                themeJson: "{}",
                themeJsonExpression: { value: '{"a":1}' },
                optionOverride: "",
                optionOverrideExpression: undefined
            })
        ).toEqual({
            preset: "custom",
            palette: "custom",
            customPalette: "#111",
            themeJson: ["{}", '{"a":1}'],
            optionOverride: ["", undefined]
        });
    });
});
