import { hidePropertiesIn, type Problem, type Properties } from "@mendix/pluggable-widgets-tools";

import type { DocumentViewerProPreviewProps } from "../typings/DocumentViewerProProps";

type Key = keyof DocumentViewerProPreviewProps;

export function getProperties(values: DocumentViewerProPreviewProps, defaultProperties: Properties): Properties {
    const hide = (keys: Key[]): void => hidePropertiesIn(defaultProperties, values, keys);

    if (values.source !== "FILE") {
        hide(["file"]);
    }
    if (values.source !== "URL") {
        hide(["url"]);
    }
    if (values.source === "LIST") {
        hide(["fileName", "previewFile", "previewMode", "markupAttribute", "onMarkupChange"]);
    } else {
        hide(["files", "listFileName", "listCaption", "listMarkupAttribute", "onListMarkupChange"]);
    }
    const markup = values.source === "LIST" ? values.listMarkupAttribute : values.markupAttribute;
    if (!markup) {
        hide(["allowMarkup", "markupAuthor", "onMarkupChange", "onListMarkupChange"]);
    }
    if (values.selectionAction === null) {
        hide(["selectionCaption"]);
    }
    if (values.initialZoom !== "CUSTOM") {
        hide(["zoomPercent"]);
    }
    if (values.heightUnit === "PARENT") {
        hide(["height"]);
    }
    if (values.toolbarPosition === "HIDDEN") {
        hide([
            "showFileName",
            "showPageControls",
            "showZoom",
            "showRotate",
            "showSearch",
            "showPrint",
            "showDownload",
            "showFullscreen",
            "toolbarContent"
        ]);
    }
    return defaultProperties;
}

export function check(values: DocumentViewerProPreviewProps): Problem[] {
    const problems: Problem[] = [];
    if (values.source === "FILE" && !values.file) {
        problems.push({ property: "file", message: "Choose the file to show." });
    }
    if (values.source === "URL" && !values.url) {
        problems.push({ property: "url", message: "Enter the URL of the file." });
    }
    if (values.source === "LIST") {
        if (!values.files) {
            problems.push({ property: "files", message: "Choose the list of files." });
        }
        if (!values.listFileName) {
            problems.push({ property: "listFileName", message: "Set the file name, usually the Name attribute." });
        }
    }
    if (
        values.initialZoom === "CUSTOM" &&
        (values.zoomPercent === null || values.zoomPercent < 25 || values.zoomPercent > 500)
    ) {
        problems.push({ property: "zoomPercent", message: "Use a zoom percentage from 25 to 500." });
    }
    if (values.heightUnit !== "PARENT" && (values.height === null || values.height < 1)) {
        problems.push({ property: "height", message: "Enter a height above 0." });
    }
    return problems;
}
