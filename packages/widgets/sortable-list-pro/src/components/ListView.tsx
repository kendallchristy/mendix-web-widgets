import { SortableRow, sizeLearner, type ListController, type SortableRowProps } from "@kendallchristy/dnd-core";
import { defaultRangeExtractor, measureElement, useVirtualizer } from "@tanstack/react-virtual";
import type { ObjectItem } from "mendix";
import {
    Component,
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type ReactElement,
    type ReactNode
} from "react";

export interface ListViewProps {
    controller: ListController;
    order: ObjectItem[];
    arriving: ReadonlySet<string>;
    layout: "vertical" | "horizontal" | "grid";
    gap: number;
    tileWidth: number;
    /** Scroll inside the widget and draw only the items on screen. */
    scrolls: boolean;
    firstLoad: boolean;
    hasMore: boolean;
    loadMore(): void;
    renderItem(item: ObjectItem): ReactNode;
    /** Changes when items need to render their content again (the content property). */
    version: unknown;
    label(item: ObjectItem): string;
    isLocked(item: ObjectItem): boolean;
    describedBy: string;
    emptyContent?: ReactNode;
}

/** Lists longer than this are windowed when the widget scrolls on its own. */
export const WINDOW_FROM = 60;

class ArrivingBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
    override state = { failed: false };
    static getDerivedStateFromError(): { failed: boolean } {
        return { failed: true };
    }
    override render(): ReactNode {
        return this.state.failed ? <div className="slp-arriving" /> : this.props.children;
    }
}

function useWidth(element: HTMLElement | null): number {
    const [width, setWidth] = useState(0);
    useLayoutEffect(() => {
        if (!element) {
            return undefined;
        }
        // The observer reports the first size before the browser paints.
        const observer = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
        observer.observe(element);
        return () => observer.disconnect();
    }, [element]);
    return width;
}

/** Calls `onVisible` when the end of the list scrolls into view, to load more objects. */
function useEndSentinel(
    root: HTMLElement | null,
    enabled: boolean,
    onVisible: () => void
): (el: HTMLElement | null) => void {
    const [sentinel, setSentinel] = useState<HTMLElement | null>(null);
    const callback = useRef(onVisible);
    useLayoutEffect(() => {
        callback.current = onVisible;
    });
    useEffect(() => {
        if (!sentinel || !enabled) {
            return undefined;
        }
        const observer = new IntersectionObserver(
            entries => {
                if (entries.some(entry => entry.isIntersecting)) {
                    callback.current();
                }
            },
            { root, rootMargin: "200px" }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [sentinel, root, enabled]);
    return setSentinel;
}

export function ListView(props: ListViewProps): ReactElement {
    const { controller, order, layout, gap, scrolls } = props;
    const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
    const [listElement, setListElement] = useState<HTMLDivElement | null>(null);
    const width = useWidth(listElement);
    const columns = layout === "grid" ? Math.max(1, Math.floor((width + gap) / (props.tileWidth + gap))) : 1;
    const windowed = scrolls && layout !== "horizontal" && order.length > WINDOW_FROM;
    const rowCount = layout === "grid" ? Math.ceil(order.length / columns) : order.length;

    const [sizes] = useState(() => sizeLearner(layout === "grid" ? 160 : 56, measureElement));
    const virtualizer = useVirtualizer({
        count: windowed ? rowCount : 0,
        getScrollElement: () => scrollElement,
        estimateSize: sizes.estimateSize,
        measureElement: sizes.measureElement,
        // Keeps the dragged item rendered while it is scrolled out of view.
        rangeExtractor: range => {
            const indexes = defaultRangeExtractor(range);
            const pinned = controller.pinnedIndex();
            const row = pinned === undefined ? undefined : layout === "grid" ? Math.floor(pinned / columns) : pinned;
            return row === undefined || row >= range.count || indexes.includes(row)
                ? indexes
                : [...indexes, row].sort((a, b) => a - b);
        },
        overscan: 6,
        gap,
        getItemKey: index =>
            layout === "grid" ? `row-${index}` : ((order[index]?.id as string | undefined) ?? `i-${index}`),
        // Positions rows and sizes the list itself, so scrolling re-renders only when rows come and go.
        directDomUpdates: windowed
    });
    const listRef = useCallback(
        (node: HTMLDivElement | null) => {
            setListElement(node);
            virtualizer.containerRef(node);
        },
        [virtualizer]
    );

    useLayoutEffect(() => {
        controller.setContainer(listElement, scrolls ? scrollElement : undefined);
    }, [controller, listElement, scrollElement, scrolls]);

    const setSentinel = useEndSentinel(scrolls ? scrollElement : null, props.hasMore, props.loadMore);

    const slot = (item: ObjectItem, index: number, extra?: Partial<SortableRowProps>): ReactElement => {
        const id = item.id as string;
        const arriving = props.arriving.has(id);
        return (
            <SortableRow
                key={id}
                item={item}
                version={arriving ? `${String(props.version)}:arriving` : props.version}
                controller={controller}
                id={id}
                index={index}
                label={props.label(item)}
                describedBy={props.describedBy}
                disabled={props.isLocked(item)}
                className={layout === "horizontal" ? "slp-slot slp-slot--row" : "slp-slot"}
                itemClassName="slp-item"
                renderContent={() =>
                    arriving ? (
                        <ArrivingBoundary>{safeRender(() => props.renderItem(item))}</ArrivingBoundary>
                    ) : (
                        props.renderItem(item)
                    )
                }
                {...extra}
            />
        );
    };

    let body: ReactNode;
    if (props.firstLoad) {
        body = (
            <div className="slp-loading" aria-busy="true">
                <span />
                <span />
                <span />
            </div>
        );
    } else if (order.length === 0) {
        body = <div className="slp-empty">{props.emptyContent}</div>;
    } else if (!windowed) {
        body = order.map((item, index) => slot(item, index));
    } else if (layout === "grid") {
        body = virtualizer.getVirtualItems().map(row => (
            <div
                key={row.key}
                ref={virtualizer.measureElement}
                data-index={row.index}
                className="slp-row"
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
                {order
                    .slice(row.index * columns, row.index * columns + columns)
                    .map((item, i) => slot(item, row.index * columns + i))}
            </div>
        ));
    } else {
        body = virtualizer.getVirtualItems().map(virtual =>
            slot(order[virtual.index], virtual.index, {
                measureIndex: virtual.index,
                measureRef: virtualizer.measureElement,
                style: { position: "absolute", top: 0, left: 0, width: "100%" }
            })
        );
    }

    return (
        <div ref={setScrollElement} className="slp-scroll">
            <div
                // A new element when windowing turns on or off, so no height is left behind from the windowed list.
                key={windowed ? "windowed" : "full"}
                ref={listRef}
                className={windowed ? "slp-list kdnd-list slp-list--windowed" : "slp-list kdnd-list"}
                role="list"
            >
                {body}
            </div>
            {props.hasMore && <div ref={setSentinel} className="slp-sentinel" aria-hidden="true" />}
        </div>
    );
}

function safeRender(render: () => ReactNode): ReactNode {
    try {
        return render();
    } catch {
        return <div className="slp-arriving" />;
    }
}
