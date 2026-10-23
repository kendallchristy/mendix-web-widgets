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

// In design mode Studio Pro hands over an expression as its source text, so a preview can only use literals.

/** The text of a string literal expression such as 'Q1', or undefined for anything else. */
export function previewText(expression: string | undefined): string | undefined {
    const match = /^'(.*)'$/.exec((expression ?? "").trim());
    return match ? match[1] : undefined;
}

/** The value of a number literal expression such as 75 or 0.5, or undefined for anything else. */
export function previewNumber(expression: string | undefined): number | undefined {
    const text = (expression ?? "").trim();
    return /^-?\d+(\.\d+)?$/.test(text) ? Number(text) : undefined;
}

/** The data and drilldown properties of the one-item-per-category widgets, as Studio Pro sees them. */
export interface CategoryDataValues {
    valueAttribute: string;
    aggregation: string;
    drilldown: boolean;
    drillAttribute1: string;
    title: string;
}

export function hideCategoryDataProperties(values: CategoryDataValues, properties: Properties): void {
    if (!values.drilldown) {
        hideProperties(properties, ["drillAttribute1", "drillAttribute2", "drillTopLabel"]);
    } else if (!values.drillAttribute1) {
        hideProperties(properties, ["drillAttribute2"]);
    }
    if (!values.title) {
        hideProperties(properties, ["titleAlign"]);
    }
}

export function checkCategoryDataProperties(values: CategoryDataValues): Problem[] {
    const problems: Problem[] = [];
    if (!values.valueAttribute && values.aggregation !== "count") {
        problems.push({
            property: "valueAttribute",
            severity: "error",
            message: "Choose a Value, or set Aggregation to Count."
        });
    }
    if (values.drilldown && !values.drillAttribute1) {
        problems.push({
            property: "drillAttribute1",
            severity: "error",
            message: "Drilldown needs a Drilldown level 2 attribute to split a clicked item by."
        });
    }
    return problems;
}
