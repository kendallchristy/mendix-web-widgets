import type { CustomChartProPreviewProps } from "../../typings/CustomChartProProps";
import { check } from "../CustomChartPro.editorConfig";

function values(overrides: Record<string, unknown> = {}): CustomChartProPreviewProps {
    return {
        optionJson: '{"series": []}',
        optionJsonExpression: "",
        dataSets: [],
        mapName: "",
        mapUrl: "",
        title: "",
        theme: "hyper",
        palette: "theme",
        customPalette: "",
        heightUnit: "pixels",
        animation: true,
        themeJson: "",
        ...overrides
    } as unknown as CustomChartProPreviewProps;
}

function dataSet(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        name: "Sales",
        field1: "",
        field1Name: "",
        field2: "",
        field2Name: "",
        field3: "",
        field3Name: "",
        field4: "",
        field4Name: "",
        field5: "",
        field5Name: "",
        field6: "",
        field6Name: "",
        ...overrides
    };
}

const messages = (v: CustomChartProPreviewProps): string[] => check(v).map(p => p.message);

describe("Custom Chart Pro editor config", () => {
    it("accepts a valid option", () => {
        expect(check(values())).toEqual([]);
    });

    it("asks for an option and reports invalid JSON", () => {
        expect(messages(values({ optionJson: "" }))).toEqual(["Add an ECharts option in Option JSON."]);
        expect(check(values({ optionJson: "", optionJsonExpression: "$currentObject/Json" }))).toEqual([]);
        expect(messages(values({ optionJson: "{ nope" }))[0]).toMatch(/^Option JSON isn't valid/);
    });

    it("checks data set names and fields", () => {
        expect(
            messages(
                values({
                    dataSets: [
                        dataSet({ field1: "Month", field1Name: "month", field2: "Amount" }),
                        dataSet(),
                        dataSet({ name: "Two words" })
                    ]
                })
            )
        ).toEqual([
            "Data set 1 (Sales): name Field 2, so the option can refer to it.",
            "Data set 2 (Sales): another data set has this name.",
            "Data set 3 (Two words): use letters, digits and underscores in its name, so the option can name it."
        ]);
    });

    it("needs a map's name and URL together", () => {
        expect(check(values({ mapName: "world", mapUrl: "https://example.com/world.json" }))).toEqual([]);
        expect(check(values({ mapName: "world" }))).toEqual([
            { property: "mapUrl", severity: "error", message: "A map needs both a name and the URL of its GeoJSON." }
        ]);
        expect(check(values({ mapUrl: "https://example.com/world.json" }))[0].property).toBe("mapName");
    });
});
