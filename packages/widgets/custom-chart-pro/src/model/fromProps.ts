import type { ChartStyle } from "@kendallchristy/chart-core";
import { defaultChartStyle } from "@kendallchristy/chart-core";

import type { CustomChartProContainerProps, CustomChartProPreviewProps } from "../../typings/CustomChartProProps";
import type { CustomSettings } from "./types";

type SharedProps = Pick<CustomChartProPreviewProps, "titleAlign" | "figuresFont" | "animation" | "background">;

interface Values extends SharedProps {
    animationDuration: number | null;
    title?: string;
    subtitle?: string;
    optionJson: Array<string | undefined>;
}

/** Custom chart settings from property values; shared by the widget and its design-mode preview. */
export function customSettings(values: Values): CustomSettings {
    const style: ChartStyle = {
        ...defaultChartStyle,
        figuresFont: values.figuresFont,
        animation: values.animation,
        animationDuration: values.animationDuration ?? 600,
        background: values.background
    };
    return {
        title: values.title || undefined,
        subtitle: values.subtitle || undefined,
        titleAlign: values.titleAlign,
        optionJson: values.optionJson,
        style
    };
}

export function settingsFromProps(props: CustomChartProContainerProps): CustomSettings {
    return customSettings({
        ...props,
        title: props.title?.value,
        subtitle: props.subtitle?.value,
        optionJson: [props.optionJson, props.optionJsonExpression?.value]
    });
}
