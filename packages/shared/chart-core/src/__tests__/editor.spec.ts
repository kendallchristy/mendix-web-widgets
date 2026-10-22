import type { Properties } from "@mendix/pluggable-widgets-tools";

import {
    checkSharedStyleProperties,
    hideNestedProperties,
    hideProperties,
    hideSharedStyleProperties
} from "../editor/properties";

function properties(): Properties {
    return [
        {
            caption: "General",
            propertyGroups: [
                {
                    caption: "Series",
                    properties: [
                        {
                            key: "series",
                            caption: "Series",
                            objects: [
                                {
                                    properties: [
                                        {
                                            caption: "Data",
                                            properties: [
                                                { key: "sizeAttribute", caption: "Size" },
                                                { key: "xAttribute", caption: "X" }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            caption: "Chart style",
            properties: [
                { key: "palette", caption: "Palette" },
                { key: "customPalette", caption: "Custom colours" },
                { key: "themeJson", caption: "Theme JSON" },
                { key: "height", caption: "Height" },
                { key: "animationDuration", caption: "Duration" }
            ]
        }
    ];
}

const keysOf = (props: Properties): string[] =>
    props.flatMap(group => [...(group.properties ?? []).map(p => p.key), ...keysOf(group.propertyGroups ?? [])]);

const values = {
    theme: "hyper",
    palette: "theme",
    customPalette: "",
    heightUnit: "pixels",
    animation: true,
    themeJson: "",
    optionOverride: ""
};

describe("editor helpers", () => {
    it("hides properties at any depth", () => {
        const props = properties();
        hideProperties(props, ["series", "height"]);
        expect(keysOf(props)).not.toContain("series");
        expect(keysOf(props)).not.toContain("height");
    });

    it("hides properties inside one object list item", () => {
        const props = properties();
        hideNestedProperties(props, "series", 0, ["sizeAttribute"]);
        const item = props[0].propertyGroups![0].properties![0].objects![0].properties;
        expect(keysOf(item)).toEqual(["xAttribute"]);
    });

    it("hides style properties that don't apply", () => {
        const props = properties();
        hideSharedStyleProperties({ ...values, heightUnit: "fill", animation: false }, props);
        expect(keysOf(props)).not.toEqual(expect.arrayContaining(["customPalette"]));
        expect(keysOf(props)).not.toContain("themeJson");
        expect(keysOf(props)).not.toContain("height");
        expect(keysOf(props)).not.toContain("animationDuration");
    });

    it("reports missing custom colours and invalid JSON", () => {
        expect(checkSharedStyleProperties(values)).toEqual([]);
        const problems = checkSharedStyleProperties({
            ...values,
            palette: "custom",
            theme: "custom",
            themeJson: "{",
            optionOverride: "[]"
        });
        expect(problems.map(p => p.property)).toEqual(["customPalette", "themeJson", "optionOverride"]);
    });
});
