import { defaultChartStyle } from "../options/style";
import { createTooltipFormatter, escapeHtml } from "../options/tooltip";
import { HYPER_LIGHT } from "../theme/tokens";

const formatValue = (n: number): string => `#${n}`;

describe("createTooltipFormatter", () => {
    it("renders a header and a row per series", () => {
        const format = createTooltipFormatter({ tokens: HYPER_LIGHT, style: defaultChartStyle, formatValue });
        const html = format([
            { seriesName: "Sales", value: ["Jan", 5], color: "#ff0000", axisValueLabel: "Jan" },
            { seriesName: "Costs", value: ["Jan", 3], color: "#00ff00", axisValueLabel: "Jan" }
        ]);
        expect(html).toContain("hc-tooltip__header");
        expect(html).toContain("Sales");
        expect(html).toContain("#5");
        expect(html).toContain("#3");
    });

    it("escapes text from data", () => {
        const format = createTooltipFormatter({ tokens: HYPER_LIGHT, style: defaultChartStyle, formatValue });
        const html = format({ seriesName: "<b>x</b>", value: 1, name: "<i>" });
        expect(html).not.toContain("<b>x</b>");
        expect(html).toContain(escapeHtml("<b>x</b>"));
    });

    it("uses a point's own tooltip text when it has one", () => {
        const format = createTooltipFormatter({ tokens: HYPER_LIGHT, style: defaultChartStyle, formatValue });
        expect(format({ seriesName: "Sales", value: 1, data: { hcTooltip: "Order 42" } })).toContain("Order 42");
    });

    it("shows only values in pill mode", () => {
        const format = createTooltipFormatter({
            tokens: HYPER_LIGHT,
            style: { ...defaultChartStyle, tooltip: "pill" },
            formatValue
        });
        const html = format({ seriesName: "Sales", value: 7 });
        expect(html).toContain("hc-tooltip--pill");
        expect(html).not.toContain("Sales");
    });
});
