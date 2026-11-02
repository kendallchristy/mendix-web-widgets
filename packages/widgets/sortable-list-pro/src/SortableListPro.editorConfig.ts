import { hidePropertiesIn, type Problem, type Properties } from "@mendix/pluggable-widgets-tools";

import type { SortableListProPreviewProps } from "../typings/SortableListProProps";

type Key = keyof SortableListProPreviewProps;

/** Hides properties that don't apply to the current configuration in Studio Pro. */
export function getProperties(values: SortableListProPreviewProps, defaultProperties: Properties): Properties {
    const hide = (keys: Key[]): void => hidePropertiesIn(defaultProperties, values, keys);
    if (values.layout !== "grid") {
        hide(["tileWidth"]);
    }
    if (values.heightMode !== "fixed") {
        hide(["height"]);
    }
    if (!values.group) {
        hide(["listName", "canReceive", "receiveAttribute", "receiveValue", "onRemove"]);
    } else if (!values.receiveAttribute) {
        hide(["receiveValue"]);
    }
    return defaultProperties;
}

export function check(values: SortableListProPreviewProps): Problem[] {
    const problems: Problem[] = [];
    if (values.group && values.receiveAttribute && !values.receiveValue) {
        problems.push({
            property: "receiveValue",
            message: "Enter this list's value for the list attribute."
        });
    }
    if (!values.onMove) {
        problems.push({
            property: "onMove",
            message:
                "Add On move to save moves. Mendix doesn't let widgets change attributes, so it sets the sort attribute to New sort value and commits."
        });
    }
    if (values.group && !values.onRemove) {
        problems.push({
            property: "onRemove",
            message:
                "Add On move to another list to save objects dragged out of this list: set the sort attribute to New sort value, the list attribute from To value, and commit."
        });
    }
    if (values.heightMode === "fixed" && (values.height ?? 0) < 80) {
        problems.push({ property: "height", message: "Use a height of at least 80 px." });
    }
    return problems;
}
