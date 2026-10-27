import { hidePropertiesIn, type Problem, type Properties } from "@mendix/pluggable-widgets-tools";

import type { ToastProPreviewProps } from "../typings/ToastProProps";

type Key = keyof ToastProPreviewProps;

export function getProperties(values: ToastProPreviewProps, defaultProperties: Properties): Properties {
    const hide = (keys: Key[]): void => hidePropertiesIn(defaultProperties, values, keys);

    if (values.trigger !== "EXPRESSION") {
        hide(["showWhen"]);
    }
    if (values.trigger !== "ATTRIBUTE") {
        hide(["showAttribute"]);
    }
    if (!values.showIcon) {
        hide(["customIcon"]);
    }
    if (!values.useCustomContent) {
        hide(["customContent", "customContentPlacement"]);
    }
    if (!values.showCloseButton) {
        hide(["closeButtonLabel"]);
    }
    if (values.duration.trim() === "" || values.duration.trim() === "0") {
        hide(["showProgress", "pauseOnHover", "pauseWhenHidden", "onTimeout"]);
    }
    return defaultProperties;
}

export function check(values: ToastProPreviewProps): Problem[] {
    const problems: Problem[] = [];
    if (values.trigger === "EXPRESSION" && !values.showWhen) {
        problems.push({ property: "showWhen", message: "Enter the Show when expression." });
    }
    if (values.trigger === "ATTRIBUTE" && !values.showAttribute) {
        problems.push({ property: "showAttribute", message: "Choose the Boolean attribute that shows the toast." });
    }
    if (!values.title && !values.message && !values.useCustomContent) {
        problems.push({ property: "message", message: "Enter a title or message, or turn on Custom content." });
    }
    if (values.maxVisible !== null && values.maxVisible < 1) {
        problems.push({ property: "maxVisible", message: "Show at least one toast at a time." });
    }
    if (values.width !== null && values.width < 200) {
        problems.push({ property: "width", message: "Use a width of at least 200 px." });
    }
    values.buttons.forEach((button, index) => {
        if (!button.caption) {
            problems.push({ property: `buttons/${index + 1}/caption`, message: "Enter a caption for the button." });
        }
    });
    return problems;
}
