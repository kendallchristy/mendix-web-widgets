import type { ReactElement } from "react";

import type { TemplateWidgetContainerProps } from "../typings/TemplateWidgetProps";
import { Caption } from "./components/Caption";
import "./ui/TemplateWidget.scss";

export function TemplateWidget(props: TemplateWidgetContainerProps): ReactElement {
    return <Caption className={props.class} style={props.style} text={props.caption?.value ?? ""} />;
}
