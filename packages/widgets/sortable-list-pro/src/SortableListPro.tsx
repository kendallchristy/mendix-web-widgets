import classNames from "classnames";
import { useId, useState, type CSSProperties, type ReactElement } from "react";

import type { SortableListProContainerProps } from "../typings/SortableListProProps";
import { ListView } from "./components/ListView";
import { useSortableList } from "./model/useSortableList";
import "./ui/SortableListPro.scss";

let instances = 0;

export function SortableListPro(props: SortableListProContainerProps): ReactElement {
    const [listId] = useState(() => `slp-${++instances}`);
    const instructionsId = useId();
    const model = useSortableList(props, listId);
    const { heightMode, layout } = props;
    const gap = Math.max(0, props.gap ?? 8);
    const tileWidth = Math.max(80, props.tileWidth || 220);

    const style = {
        ...props.style,
        "--slp-gap": `${gap}px`,
        "--slp-tile": `${tileWidth}px`,
        ...(heightMode === "fixed" ? { height: `${Math.max(80, props.height || 480)}px` } : {})
    } as CSSProperties;

    return (
        <div
            className={classNames("slp kdnd-root", `slp--${layout}`, `slp--height-${heightMode}`, props.class, {
                "kdnd-indicator-line": props.indicator === "line"
            })}
            style={style}
        >
            <span id={instructionsId} className="kdnd-sr-only">
                {props.instructions?.value ?? ""}
            </span>
            <ListView
                controller={model.controller}
                order={model.order}
                arriving={model.arriving}
                layout={layout}
                gap={gap}
                tileWidth={tileWidth}
                scrolls={heightMode !== "auto"}
                firstLoad={model.firstLoad}
                hasMore={model.hasMore}
                loadMore={model.loadMore}
                renderItem={item => props.content.get(item)}
                version={props.content}
                label={model.label}
                isLocked={item => {
                    try {
                        return props.canDrag.get(item).value === false;
                    } catch {
                        return false;
                    }
                }}
                describedBy={instructionsId}
                emptyContent={props.emptyContent}
            />
        </div>
    );
}
