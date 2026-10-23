import type { Properties } from "@mendix/pluggable-widgets-tools";

import type { DatePickerProPreviewProps } from "../typings/DatePickerProProps";

export function getProperties(_values: DatePickerProPreviewProps, defaultProperties: Properties): Properties {
    // Hide or rename properties in Studio Pro based on the current values here.
    return defaultProperties;
}
