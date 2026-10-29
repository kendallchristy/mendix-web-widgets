import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactElement } from "react";

import { loadEngine } from "../core/engines";
import { ACTIVE_MARK_CLASS } from "../core/search";
import { resolveScale } from "../core/zoom";
import { useDomSearch, useElementSize } from "./hooks";
import type { ViewProps } from "./types";

const PRINT_CSS = `
.docx-wrapper { background: none !important; padding: 0 !important; display: block !important; }
.docx-wrapper > section.docx { box-shadow: none !important; margin: 0 auto !important; page-break-after: always; break-after: page; }
.docx-wrapper > section.docx:last-child { page-break-after: auto; break-after: auto; }
@page { margin: 0; }`;

export function DocxView(props: ViewProps): ReactElement {
    const { file, callbacks, zoom, layout, query, activeMatch, goTo } = props;
    const scroller = useRef<HTMLDivElement>(null);
    const body = useRef<HTMLDivElement>(null);
    const styles = useRef<HTMLDivElement>(null);
    const viewport = useElementSize(scroller);
    const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null);
    const [version, setVersion] = useState(0);
    const [current, setCurrent] = useState(0);
    const [pageCount, setPageCount] = useState(1);

    const sections = useCallback(
        (): HTMLElement[] => Array.from(body.current?.querySelectorAll<HTMLElement>("section.docx") ?? []),
        []
    );

    useEffect(() => {
        let cancelled = false;
        const host = body.current;
        const styleHost = styles.current;
        if (!host || !styleHost || !file.bytes) {
            return;
        }
        host.replaceChildren();
        styleHost.replaceChildren();
        loadEngine("docx")
            .then(engine =>
                engine.renderAsync(file.bytes as ArrayBuffer, host, styleHost, {
                    className: "docx",
                    inWrapper: true,
                    breakPages: true,
                    ignoreLastRenderedPageBreak: true,
                    experimental: true,
                    renderHeaders: true,
                    renderFooters: true,
                    renderFootnotes: true,
                    renderEndnotes: true,
                    renderComments: false,
                    useBase64URL: true
                })
            )
            .then(() => {
                if (cancelled) {
                    return;
                }
                const pages = sections();
                const first = pages[0];
                setPageSize(first ? { width: first.offsetWidth, height: first.offsetHeight } : null);
                setPageCount(Math.max(pages.length, 1));
                setVersion(v => v + 1);
                callbacks.onReady({
                    pageCount: Math.max(pages.length, 1),
                    zoomable: true,
                    fits: Boolean(first),
                    rotatable: false,
                    searchable: true,
                    print: async () => ({
                        kind: "html",
                        html: host.innerHTML,
                        css: `${Array.from(styleHost.querySelectorAll("style"))
                            .map(style => style.textContent)
                            .join("\n")}\n${PRINT_CSS}`
                    })
                });
            })
            .catch(() => {
                if (!cancelled) {
                    callbacks.onError();
                }
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file]);

    const scale = resolveScale(zoom, pageSize ?? undefined, viewport);
    useEffect(() => {
        callbacks.onScale(scale);
    }, [scale, callbacks]);

    const updateCurrent = useCallback(() => {
        const element = scroller.current;
        if (!element || layout === "single") {
            return;
        }
        const top = element.getBoundingClientRect().top + Math.min(element.clientHeight / 3, 200);
        const pages = sections();
        let index = 0;
        pages.forEach((page, i) => {
            if (page.getBoundingClientRect().top <= top) {
                index = i;
            }
        });
        setCurrent(index);
    }, [layout, sections]);

    useEffect(() => {
        if (version > 0) {
            callbacks.onPage(current + 1);
        }
    }, [current, callbacks, version]);

    const [shownGoTo, setShownGoTo] = useState(goTo);
    if (goTo !== shownGoTo) {
        setShownGoTo(goTo);
        if (goTo) {
            setCurrent(Math.min(Math.max(goTo.page, 1), pageCount) - 1);
        }
    }
    useEffect(() => {
        if (!goTo) {
            return;
        }
        const pages = sections();
        const index = Math.min(Math.max(goTo.page, 1), pages.length) - 1;
        if (layout === "continuous") {
            pages[index]?.scrollIntoView?.({ block: "start" });
        } else if (scroller.current) {
            scroller.current.scrollTop = 0;
        }
    }, [goTo, layout, sections]);

    // One page at a time hides every page but the current one.
    useLayoutEffect(() => {
        sections().forEach((page, i) => page.classList.toggle("dvp-hidden", layout === "single" && i !== current));
    }, [layout, current, version, sections]);

    useDomSearch(() => body.current, query, activeMatch, version, callbacks.onMatches);

    // With one page at a time, show the page that holds the active match.
    useEffect(() => {
        if (layout !== "single") {
            return;
        }
        const section = body.current?.querySelector(`.${ACTIVE_MARK_CLASS}`)?.closest("section.docx");
        const index = section ? sections().indexOf(section as HTMLElement) : -1;
        if (index >= 0) {
            setCurrent(index);
            requestAnimationFrame(() => {
                body.current?.querySelector(`.${ACTIVE_MARK_CLASS}`)?.scrollIntoView?.({ block: "center" });
            });
        }
    }, [activeMatch, query, version, layout, sections]);

    return (
        <div ref={scroller} className="dvp-docx" onScroll={updateCurrent}>
            <div ref={styles} hidden />
            <div ref={body} className="dvp-docx-body" style={{ zoom: scale }} />
        </div>
    );
}
