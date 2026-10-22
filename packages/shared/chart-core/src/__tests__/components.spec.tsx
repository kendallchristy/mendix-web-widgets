import { fireEvent, render, screen } from "@testing-library/react";

import { Breadcrumb } from "../components/Breadcrumb";
import { EChart } from "../components/EChart";
import { charts } from "../__mocks__/echarts/core";

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
});
