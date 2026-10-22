import type { Properties } from "@mendix/pluggable-widgets-tools";

import type { TemplateWidgetPreviewProps } from "../typings/TemplateWidgetProps";

export function getProperties(_values: TemplateWidgetPreviewProps, defaultProperties: Properties): Properties {
    // Hide or rename properties in Studio Pro based on the current values here.
    return defaultProperties;
}
