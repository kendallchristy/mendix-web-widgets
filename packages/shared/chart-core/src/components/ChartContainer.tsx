import classNames from "classnames";
import type { CSSProperties, ReactNode } from "react";
import { forwardRef } from "react";

export type HeightUnit = "pixels" | "percentageOfWidth" | "fill";

export interface ChartContainerProps {
    widgetClass: string;
    className?: string;
    style?: CSSProperties;
    heightUnit: HeightUnit;
    height: number;
    background: string;
    figuresFont: string;
    textFont: string;
    labelColor: string;
    textColor: string;
    children: ReactNode;
}

/** The widget's outer element: sizing, background and the fonts the HTML parts (tooltip, breadcrumb) use. */
export const ChartContainer = forwardRef<HTMLDivElement, ChartContainerProps>(function ChartContainer(props, ref) {
    const sizing: CSSProperties =
        props.heightUnit === "fill"
            ? { height: "100%" }
            : props.heightUnit === "percentageOfWidth"
              ? { aspectRatio: `100 / ${Math.max(1, props.height)}` }
              : { height: `${Math.max(1, props.height)}px` };

    const style = {
        ...sizing,
        background: props.background,
        "--hc-current-font": props.textFont,
        "--hc-current-figures-font": props.figuresFont,
        "--hc-current-label": props.labelColor,
        "--hc-current-text": props.textColor,
        ...props.style
    } as CSSProperties;

    return (
        <div ref={ref} className={classNames("hc-chart", props.widgetClass, props.className)} style={style}>
            {props.children}
        </div>
    );
});
