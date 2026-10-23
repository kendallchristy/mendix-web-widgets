// Helpers for the widgets' editorConfig files, which hide Studio Pro properties that don't apply. These mirror the
// helpers in @mendix/pluggable-widgets-tools without bundling the tools package into Studio Pro.
import type { Problem, Properties, Property, PropertyGroup } from "@mendix/pluggable-widgets-tools";

import { parseJsonObject } from "../options/merge";
import { parseColorList } from "../theme/tokens";

function removeFrom(groups: PropertyGroup[] | undefined, matches: (property: Property) => boolean): void {
    for (const group of groups ?? []) {
        removeFrom(group.propertyGroups, matches);
        if (group.properties) {
            group.properties = group.properties.filter(property => !matches(property));
        }
    }
}

export function hideProperties(properties: Properties, keys: string[]): void {
    removeFrom(properties, property => keys.includes(property.key));
}

/** Hides properties inside one item of an object list, such as one series. */
export function hideNestedProperties(properties: Properties, listKey: string, index: number, keys: string[]): void {
    const visit = (groups: PropertyGroup[] | undefined): void => {
        for (const group of groups ?? []) {
            visit(group.propertyGroups);
            for (const property of group.properties ?? []) {
                if (property.key !== listKey) {
                    continue;
                }
                const item = property.objects?.[index]?.properties ?? property.properties?.[index];
                if (item) {
                    hideProperties(item, keys);
                }
            }
        }
    };
    visit(properties);
}

/** The Chart style and Advanced properties every chart widget shares, as Studio Pro sees them. */
export interface SharedStyleValues {
    theme: string;
    palette: string;
    customPalette: string;
    heightUnit: string;
    animation: boolean;
    themeJson: string;
    optionOverride: string;
}

export function hideSharedStyleProperties(values: SharedStyleValues, properties: Properties): void {
    if (values.palette !== "custom") {
        hideProperties(properties, ["customPalette"]);
    }
    if (values.theme !== "custom") {
        hideProperties(properties, ["themeJson", "themeJsonExpression"]);
    }
    if (values.heightUnit === "fill") {
        hideProperties(properties, ["height"]);
    }
    if (!values.animation) {
        hideProperties(properties, ["animationDuration"]);
    }
}

export const THEME_BUILDER_URL = "https://echarts.apache.org/en/theme-builder.html";

export function checkSharedStyleProperties(values: SharedStyleValues): Problem[] {
    const problems: Problem[] = [];
    if (values.palette === "custom" && parseColorList(values.customPalette).length === 0) {
        problems.push({
            property: "customPalette",
            severity: "error",
            message: "Add at least one colour, for example #8038D0."
        });
    }
    if (values.theme === "custom") {
        const theme = parseJsonObject(values.themeJson);
        if (theme.error) {
            problems.push({
                property: "themeJson",
                severity: "error",
                message: `Theme JSON isn't valid: ${theme.error}`
            });
        }
    }
    const override = parseJsonObject(values.optionOverride);
    if (override.error) {
        problems.push({
            property: "optionOverride",
            severity: "error",
            message: `Option override isn't valid JSON: ${override.error}`
        });
    }
    return problems;
}
