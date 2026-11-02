import classNames from "classnames";
import type { CSSProperties, ReactElement } from "react";

import type { SortableListProPreviewProps } from "../typings/SortableListProProps";

/** Design mode preview in Studio Pro: the content drop zone, then two faded copies to show the layout. */
export function preview(props: SortableListProPreviewProps): ReactElement {
    const Content = props.content.renderer;
    const gap = props.gap ?? 8;
    const style = {
        ...props.styleObject,
        "--slp-gap": `${gap}px`,
        "--slp-tile": `${props.tileWidth ?? 220}px`
    } as CSSProperties;
    const item = (key: number): ReactElement => (
        <div key={key} className="kdnd-slot slp-slot" style={key > 0 ? { opacity: 0.35 } : undefined}>
            <div className={classNames("kdnd-item slp-item", { "kdnd-item--handle": props.dragHandle !== "item" })}>
                {props.dragHandle === "grip" && <span className="kdnd-grip">⋮⋮</span>}
                <div className="kdnd-item-content">
                    {key === 0 ? (
                        <Content caption="Content: the widgets shown for each object">
                            <div />
                        </Content>
                    ) : (
                        <div className="slp-arriving" />
                    )}
                </div>
            </div>
        </div>
    );
    return (
        <div className={classNames("slp kdnd-root", `slp--${props.layout}`, props.class)} style={style}>
            <div className="slp-scroll">
                <div className="slp-list kdnd-list">{[0, 1, 2].map(item)}</div>
            </div>
        </div>
    );
}

export function getPreviewCss(): string {
    // Studio Pro expects the compiled stylesheet as a string, which the widget build provides for require()
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("./ui/SortableListPro.scss");
}
