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
        hide(["listName", "canReceive", "receiveAttribute", "receiveValue", "onReceive", "onRemove"]);
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
            message: "Enter the value this list writes to the attribute when an item arrives."
        });
    }
    if (values.heightMode === "fixed" && (values.height ?? 0) < 80) {
        problems.push({ property: "height", message: "Use a height of at least 80 px." });
    }
    return problems;
}
