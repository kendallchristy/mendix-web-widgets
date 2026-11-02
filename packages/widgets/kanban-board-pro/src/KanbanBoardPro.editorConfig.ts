import { hidePropertiesIn, type Problem, type Properties } from "@mendix/pluggable-widgets-tools";

import type { KanbanBoardProPreviewProps } from "../typings/KanbanBoardProProps";

type Key = keyof KanbanBoardProPreviewProps;

const DATASOURCE_ONLY: Key[] = [
    "columns",
    "columnTitle",
    "columnKey",
    "columnHeader",
    "columnFooter",
    "columnSortAttribute",
    "columnLimit",
    "cardColumn",
    "onColumnMove"
];

/** Hides properties that don't apply to the current configuration in Studio Pro. */
export function getProperties(values: KanbanBoardProPreviewProps, defaultProperties: Properties): Properties {
    const hide = (keys: Key[]): void => hidePropertiesIn(defaultProperties, values, keys);
    if (values.columnSource === "enumeration") {
        hide(DATASOURCE_ONLY);
    } else {
        hide(["cardStatus"]);
        if (!values.columnSortAttribute) {
            hide(["onColumnMove"]);
        }
    }
    if (values.heightMode !== "fixed") {
        hide(["height"]);
    }
    return defaultProperties;
}

export function check(values: KanbanBoardProPreviewProps): Problem[] {
    const problems: Problem[] = [];
    if (values.columnSource === "datasource") {
        if (!values.columns) {
            problems.push({ property: "columns", message: "Choose the data source for the columns." });
        }
        if (!values.cardColumn) {
            problems.push({ property: "cardColumn", message: "Choose the association from a card to its column." });
        }
        if (!values.columnTitle) {
            problems.push({ property: "columnTitle", message: "Enter a title for the columns." });
        }
        if (values.columnSortAttribute && !values.onColumnMove) {
            problems.push({
                property: "onColumnMove",
                message:
                    "Add On column move to save column moves: set the column sort attribute to New sort value and commit."
            });
        }
    } else if (!values.cardStatus) {
        problems.push({
            property: "cardStatus",
            message: "Choose the enumeration attribute that sets a card's column."
        });
    }
    if (!values.onCardMove) {
        problems.push({
            property: "onCardMove",
            message:
                "Add On card move to save moves. Mendix doesn't let widgets change attributes, so it sets the card sort attribute to New sort value, the column from To column, and commits."
        });
    }
    if (values.heightMode === "fixed" && (values.height ?? 0) < 160) {
        problems.push({ property: "height", message: "Use a height of at least 160 px." });
    }
    return problems;
}
