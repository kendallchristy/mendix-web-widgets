import type { EditableValue } from "mendix";
import { useCallback, useEffect, useMemo, type ReactElement } from "react";

import type { DatePickerProContainerProps } from "../typings/DatePickerProProps";
import { DatePickerView } from "./components/DatePickerView";
import type { PickerValue } from "./core/types";
import { fromAttribute, toAttribute } from "./core/zone";
import { buildConfig } from "./mendix/buildConfig";
import "./ui/DatePickerPro.scss";

function useRequiredValidator(attribute: EditableValue<Date> | undefined, required: boolean, message: string): void {
    const configured = !!attribute;
    useEffect(() => {
        attribute?.setValidator(required ? value => (value ? undefined : message) : undefined);
        // Only re-register when the rule changes; the attribute object changes on every update.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [configured, required, message]);
}

export function DatePickerPro(props: DatePickerProContainerProps): ReactElement {
    const range = props.selectionType === "RANGE";
    const startAttribute = range ? props.startDateAttribute : props.dateAttribute;
    const endAttribute = range ? props.endDateAttribute : undefined;
    const readOnly = !startAttribute || startAttribute.readOnly || (range && (!endAttribute || endAttribute.readOnly));

    const { config, utc } = buildConfig(props, readOnly);
    const value: PickerValue = {
        start: fromAttribute(startAttribute?.value, utc),
        end: fromAttribute(endAttribute?.value, utc)
    };

    const required = props.required.value === true;
    const requiredMessage = props.requiredMessage.value ?? "";
    useRequiredValidator(startAttribute, required, requiredMessage);
    useRequiredValidator(endAttribute, required, requiredMessage);

    const onCommit = useCallback(
        (next: PickerValue) => {
            startAttribute?.setValue(toAttribute(next.start, utc));
            if (range) {
                endAttribute?.setValue(toAttribute(next.end, utc));
            }
            if (props.onChange?.canExecute && !props.onChange.isExecuting) {
                props.onChange.execute();
            }
        },
        [startAttribute, endAttribute, range, utc, props.onChange]
    );

    const onOpenChange = useCallback(
        (open: boolean) => {
            const action = open ? props.onEnter : props.onLeave;
            if (action?.canExecute && !action.isExecuting) {
                action.execute();
            }
        },
        [props.onEnter, props.onLeave]
    );

    // A nanoflow sets the close attribute to true to close the popup; the widget sets it back.
    const closeAttribute = props.closeAttribute;
    const onCloseHandled = useCallback(() => {
        if (closeAttribute && !closeAttribute.readOnly) {
            closeAttribute.setValue(false);
        }
    }, [closeAttribute]);

    const validation = useMemo(
        () => [...new Set([startAttribute?.validation, endAttribute?.validation].filter(Boolean))].join(" "),
        [startAttribute?.validation, endAttribute?.validation]
    );

    return (
        <DatePickerView
            config={config}
            value={value}
            onCommit={onCommit}
            onOpenChange={onOpenChange}
            closeRequested={closeAttribute?.value === true}
            onCloseHandled={onCloseHandled}
            validation={validation || undefined}
        />
    );
}
