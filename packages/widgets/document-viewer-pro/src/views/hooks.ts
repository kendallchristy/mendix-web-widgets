import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

import { clearHighlights, highlightMatches, setActiveMark } from "../core/search";
import { clampScale, type Zoom } from "../core/zoom";

/** Size of an element, kept current with a ResizeObserver. */
export function useElementSize(ref: RefObject<HTMLElement | null>): { width: number; height: number } {
    const [size, setSize] = useState({ width: 0, height: 0 });
    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) {
            return;
        }
        const measure = (): void => {
            setSize(previous =>
                previous.width === element.clientWidth && previous.height === element.clientHeight
                    ? previous
                    : { width: element.clientWidth, height: element.clientHeight }
            );
        };
        measure();
        if (typeof ResizeObserver === "undefined") {
            return;
        }
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        return () => {
            observer.disconnect();
        };
    }, [ref]);
    return size;
}

/** The scale of a view whose content reflows (text, code, email): only a percentage changes it. */
export function reflowScale(zoom: Zoom): number {
    return zoom.mode === "custom" ? clampScale(zoom.scale) : 1;
}

/**
 * Highlights search matches in rendered HTML and marks the active one. `version` changes whenever the content is
 * re-rendered, so the marks are applied again.
 */
export function useDomSearch(
    getRoot: () => Node | null | undefined,
    query: string,
    activeMatch: number,
    version: unknown,
    onMatches: (count: number) => void
): void {
    const marks = useRef<HTMLElement[]>([]);
    const latestRoot = useRef(getRoot);
    useLayoutEffect(() => {
        latestRoot.current = getRoot;
    });
    useEffect(() => {
        const root = latestRoot.current();
        if (!root) {
            return;
        }
        clearHighlights(root as ParentNode);
        marks.current = query.trim() ? highlightMatches(root, query) : [];
        onMatches(marks.current.length);
    }, [query, version, onMatches]);
    useEffect(() => {
        setActiveMark(marks.current, activeMatch);
    }, [activeMatch, query, version]);
}

/** Text of a file, honoring a byte order mark and falling back to Windows-1252 for invalid UTF-8. */
export function decodeText(bytes: ArrayBuffer | undefined): string {
    if (!bytes) {
        return "";
    }
    const view = new Uint8Array(bytes);
    if (view[0] === 0xff && view[1] === 0xfe) {
        return new TextDecoder("utf-16le").decode(view);
    }
    if (view[0] === 0xfe && view[1] === 0xff) {
        return new TextDecoder("utf-16be").decode(view);
    }
    try {
        return new TextDecoder("utf-8", { fatal: true }).decode(view);
    } catch {
        return new TextDecoder("windows-1252").decode(view);
    }
}
