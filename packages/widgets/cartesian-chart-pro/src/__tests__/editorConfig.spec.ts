import type { Properties } from "@mendix/pluggable-widgets-tools";

import type { CartesianChartProPreviewProps } from "../../typings/CartesianChartProProps";
import { check, getProperties } from "../CartesianChartPro.editorConfig";

function seriesValues(overrides: Record<string, unknown> = {}) {
    return {
        seriesType: "line",
        yAttribute: "Amount",
        sizeAttribute: "",
        groupByAttribute: "",
        aggregation: "none",
        ...overrides
    };
}

function values(overrides: Record<string, unknown> = {}): CartesianChartProPreviewProps {
    return {
        series: [seriesValues()],
        drilldown: "none",
        theme: "hyper",
        palette: "theme",
        customPalette: "",
        heightUnit: "pixels",
        animation: true,
        themeJson: "",
        optionOverride: "",
        title: "",
        ...overrides
    } as unknown as CartesianChartProPreviewProps;
}

function properties(): Properties {
    const seriesItem = [
        {
            caption: "Data",
            properties: ["sizeAttribute", "color", "drillAttribute1", "drillAttribute2"].map(key => ({
                key,
                caption: key
            }))
        }
    ];
    return [
        {
            caption: "General",
            properties: [
                { key: "series", caption: "Series", objects: [{ properties: seriesItem }] },
                ...["drillDateFrom", "drillDateTo", "drillTopLabel", "titleAlign"].map(key => ({ key, caption: key }))
            ]
        }
    ];
}

const keys = (props: Properties): string[] => props.flatMap(g => (g.properties ?? []).map(p => p.key));
const seriesKeys = (props: Properties): string[] => keys(props[0].properties![0].objects![0].properties);

describe("Chart editor config", () => {
    it("hides bubble size, drilldown attributes and drilldown settings when they don't apply", () => {
        const props = getProperties(values(), properties());
        expect(seriesKeys(props)).toEqual(["color"]);
        expect(keys(props)).toEqual(["series"]);
    });

    it("shows them when they apply", () => {
        const props = getProperties(
            values({ series: [seriesValues({ seriesType: "bubble" })], drilldown: "date", title: "Sales" }),
            properties()
        );
        expect(seriesKeys(props)).toEqual(["sizeAttribute", "color"]);
        expect(keys(props)).toEqual(["series", "drillDateFrom", "drillDateTo", "drillTopLabel", "titleAlign"]);
    });

    it("asks for a Y value unless counting", () => {
        expect(check(values({ series: [seriesValues({ yAttribute: "" })] })).map(p => p.property)).toEqual([
            "series/1/yAttribute"
        ]);
        expect(check(values({ series: [seriesValues({ yAttribute: "", aggregation: "count" })] }))).toEqual([]);
    });

    it("needs at least one series", () => {
        expect(check(values({ series: [] })).map(p => p.property)).toEqual(["series"]);
    });
});
