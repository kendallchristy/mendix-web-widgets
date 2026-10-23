import type { Properties } from "@mendix/pluggable-widgets-tools";

import type { FunnelChartProPreviewProps } from "../../typings/FunnelChartProProps";
import { check, getProperties } from "../FunnelChartPro.editorConfig";

function values(overrides: Record<string, unknown> = {}): FunnelChartProPreviewProps {
    return {
        valueAttribute: "Amount",
        aggregation: "sum",
        sortOrder: "valueDesc",
        drilldown: false,
        drillAttribute1: "",
        title: "",
        labelPosition: "outside",
        conversion: "first",
        theme: "hyper",
        palette: "theme",
        customPalette: "",
        heightUnit: "pixels",
        animation: true,
        themeJson: "",
        optionOverride: "",
        ...overrides
    } as unknown as FunnelChartProPreviewProps;
}

describe("Funnel editor config", () => {
    it("hides label options when labels are hidden", () => {
        const props: Properties = [
            {
                caption: "All",
                properties: ["showName", "showValue", "percentDecimals"].map(key => ({ key, caption: key }))
            }
        ];
        expect(getProperties(values({ labelPosition: "hidden", conversion: "off" }), props)[0].properties).toEqual([]);
    });

    it("reminds that data source order sets the stage order", () => {
        expect(check(values())).toEqual([]);
        expect(check(values({ sortOrder: "data" })).map(p => p.property)).toEqual(["sortOrder"]);
    });
});
