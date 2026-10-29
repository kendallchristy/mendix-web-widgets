import {
    Fragment,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type ReactElement
} from "react";

import {
    currentPageAt,
    layoutPages,
    PAGE_PADDING,
    rotateSize,
    visiblePages,
    type PageLayout,
    type PageSize
} from "../core/pages";
import { resolveScale, type Zoom } from "../core/zoom";
import { useElementSize } from "./hooks";
import type { PageOverlay, PageRequest } from "./types";

/** Draws one page into its host element and returns a cleanup function. */
export type RenderPage = (index: number, host: HTMLDivElement, scale: number, rotation: number) => (() => void) | void;

export interface PagedViewProps {
    /** Page sizes in CSS pixels at 100%, before the user's rotation. */
    sizes: PageSize[];
    rotation: number;
    zoom: Zoom;
    layout: "continuous" | "single";
    goTo: PageRequest | null;
    renderPage: RenderPage;
    onPage(page: number): void;
    onScale(scale: number): void;
    allowCopy?: boolean;
    /** Drag with the mouse to move around, for images. */
    pannable?: boolean;
    /** Largest scale the fit modes pick. */
    maxFit?: number;
    overlay?: PageOverlay;
}

function PageSlot(props: {
    index: number;
    top: number;
    left: number;
    width: number;
    height: number;
    scale: number;
    rotation: number;
    renderPage: RenderPage;
}): ReactElement {
    const { index, scale, rotation, renderPage } = props;
    const host = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!host.current) {
            return;
        }
        const cleanup = renderPage(index, host.current, scale, rotation);
        return () => {
            cleanup?.();
        };
    }, [index, scale, rotation, renderPage]);
    return (
        <div
            ref={host}
            className="dvp-page"
            data-page={index + 1}
            style={{ top: props.top, left: props.left, width: props.width, height: props.height }}
        />
    );
}

/**
 * A scrolling column of pages that only draws the pages near the viewport, so documents with hundreds of pages
 * stay fast. Used by the PDF, TIFF and PowerPoint views.
 */
export function PagedView(props: PagedViewProps): ReactElement {
    const { sizes, rotation, zoom, layout, goTo, renderPage, onPage, onScale } = props;
    const scroller = useRef<HTMLDivElement>(null);
    const viewport = useElementSize(scroller);
    const [scrollTop, setScrollTop] = useState(0);
    const [chosenPage, setChosenPage] = useState(0);
    const singlePage = Math.max(0, Math.min(chosenPage, sizes.length - 1));

    // With one page at a time, a page request switches the page.
    const [shownGoTo, setShownGoTo] = useState(goTo);
    if (goTo !== shownGoTo) {
        setShownGoTo(goTo);
        if (goTo) {
            setChosenPage(goTo.page - 1);
        }
    }

    // Browsers round the measured size, up to half a pixel over the real one, so fit modes leave a pixel spare.
    // Otherwise a page that exactly fills the viewer can overflow it by a fraction, show scrollbars, shrink to make
    // room for them, fit again without them and start over.
    const scale = useMemo(
        () =>
            resolveScale(
                zoom,
                sizes[0] ? rotateSize(sizes[0], rotation) : undefined,
                { width: viewport.width - 1, height: viewport.height - 1 },
                props.maxFit
            ),
        [zoom, sizes, rotation, viewport, props.maxFit]
    );

    const rotatedSizes = useMemo(() => sizes.map(size => rotateSize(size, rotation)), [sizes, rotation]);
    const pageLayout: PageLayout = useMemo(() => {
        if (layout === "single") {
            const size = rotatedSizes[singlePage];
            return layoutPages(size ? [size] : [], scale);
        }
        return layoutPages(rotatedSizes, scale);
    }, [rotatedSizes, scale, layout, singlePage]);

    const current = layout === "single" ? singlePage : currentPageAt(pageLayout, scrollTop, viewport.height || 1);

    useEffect(() => {
        onScale(scale);
    }, [scale, onScale]);

    useEffect(() => {
        if (sizes.length > 0) {
            onPage(Math.min(current, sizes.length - 1) + 1);
        }
    }, [current, sizes.length, onPage]);

    // Keep the reader on the same spot of the same page when the scale or rotation changes. The scroll handler
    // records the spot against the layout it saw; after a re-layout the same spot is restored in the new one.
    const layoutRef = useRef(pageLayout);
    const anchor = useRef<{ page: number; fraction: number } | null>(null);
    useLayoutEffect(() => {
        const element = scroller.current;
        const spot = anchor.current;
        if (element && spot && layout === "continuous" && layoutRef.current !== pageLayout) {
            const top = pageLayout.offsets[spot.page];
            const height = pageLayout.heights[spot.page];
            if (top !== undefined && height !== undefined) {
                element.scrollTop = top + spot.fraction * height;
                setScrollTop(element.scrollTop);
            }
        }
        layoutRef.current = pageLayout;
    }, [pageLayout, layout]);

    useEffect(() => {
        if (!goTo || sizes.length === 0) {
            return;
        }
        const element = scroller.current;
        if (!element) {
            return;
        }
        if (layout === "single") {
            element.scrollTop = 0;
            return;
        }
        // The scroll event that follows updates the visible pages.
        const top = pageLayout.offsets[Math.min(Math.max(goTo.page, 1), sizes.length) - 1];
        if (top !== undefined) {
            element.scrollTop = Math.max(0, top - PAGE_PADDING / 2);
        }
        // Only a new request scrolls; a re-layout must not jump back to the requested page.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [goTo]);

    const frame = useRef(0);
    const onScroll = useCallback(() => {
        const element = scroller.current;
        const current = layoutRef.current;
        if (element && current.offsets.length > 0) {
            const page = currentPageAt(current, element.scrollTop, element.clientHeight || 1);
            anchor.current = {
                page,
                fraction: (element.scrollTop - (current.offsets[page] ?? 0)) / (current.heights[page] || 1)
            };
        }
        cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(() => {
            if (scroller.current) {
                setScrollTop(scroller.current.scrollTop);
            }
        });
    }, []);
    useEffect(() => () => cancelAnimationFrame(frame.current), []);

    const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
    const onPointerDown = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            const element = scroller.current;
            if (!props.pannable || !element || event.pointerType !== "mouse" || event.button !== 0) {
                return;
            }
            drag.current = { x: event.clientX, y: event.clientY, left: element.scrollLeft, top: element.scrollTop };
            element.setPointerCapture?.(event.pointerId);
            element.classList.add("dvp-pages--dragging");
        },
        [props.pannable]
    );
    const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const element = scroller.current;
        const start = drag.current;
        if (element && start) {
            element.scrollLeft = start.left - (event.clientX - start.x);
            element.scrollTop = start.top - (event.clientY - start.y);
        }
    }, []);
    const onPointerUp = useCallback(() => {
        drag.current = null;
        scroller.current?.classList.remove("dvp-pages--dragging");
    }, []);

    const shown =
        layout === "single"
            ? pageLayout.offsets.length > 0
                ? [0]
                : []
            : visiblePages(pageLayout, scrollTop, viewport.height || 800, 1);
    // Pages center in the viewport; a page wider than the rest (landscape among portrait) scrolls sideways.
    const contentWidth = Math.max(viewport.width, pageLayout.maxWidth + PAGE_PADDING * 2);
    // When the pages fit, that direction gets no scrollbar at all, so rounding can never bring one up.
    const overflow: CSSProperties = {
        overflowX: pageLayout.maxWidth + PAGE_PADDING * 2 <= viewport.width ? "hidden" : "auto",
        overflowY: pageLayout.totalHeight <= viewport.height ? "hidden" : "auto"
    };

    return (
        <div
            ref={scroller}
            className={props.pannable ? "dvp-pages dvp-pages--pannable" : "dvp-pages"}
            style={viewport.width > 0 ? overflow : undefined}
            onScroll={onScroll}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            data-allow-copy={props.allowCopy === false ? "false" : undefined}
        >
            <div className="dvp-pages-content" style={{ height: pageLayout.totalHeight, width: contentWidth }}>
                {shown.map(slot => {
                    const index = layout === "single" ? singlePage : slot;
                    const width = pageLayout.widths[slot] ?? 0;
                    const height = pageLayout.heights[slot] ?? 0;
                    const top = pageLayout.offsets[slot] ?? 0;
                    const left = Math.max(PAGE_PADDING, (viewport.width - width) / 2);
                    return (
                        <Fragment key={index}>
                            <PageSlot
                                index={index}
                                top={top}
                                left={left}
                                width={width}
                                height={height}
                                scale={scale}
                                rotation={rotation}
                                renderPage={renderPage}
                            />
                            {props.overlay && (
                                <div className="dvp-page-overlay" style={{ top, left, width, height }}>
                                    {props.overlay(index + 1, { width, height, rotation })}
                                </div>
                            )}
                        </Fragment>
                    );
                })}
            </div>
        </div>
    );
}
