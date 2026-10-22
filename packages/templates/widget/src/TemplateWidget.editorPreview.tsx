import type { ReactElement } from "react";

import type { TemplateWidgetPreviewProps } from "../typings/TemplateWidgetProps";
import { Caption } from "./components/Caption";

export function preview(props: TemplateWidgetPreviewProps): ReactElement {
    return <Caption className={props.className} text={props.caption || "Template Widget"} />;
}

export function getPreviewCss(): string {
    // Studio Pro expects the compiled stylesheet as a string, which the widget build provides for require()
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("./ui/TemplateWidget.scss");
}
