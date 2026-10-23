import type { RefObject } from "react";
import { useEffect, useState } from "react";

export interface ElementSize {
    width: number;
    height: number;
}

/** The element's size, updated as it resizes. Zero until the first measurement, and while `enabled` is false. */
export function useElementSize(ref: RefObject<HTMLElement | null>, enabled: boolean): ElementSize {
    const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });
    useEffect(() => {
        const element = ref.current;
        if (!enabled || !element || typeof ResizeObserver === "undefined") {
            return;
        }
        const observer = new ResizeObserver(([entry]) => {
            const width = Math.round(entry.contentRect.width);
            const height = Math.round(entry.contentRect.height);
            setSize(current => (current.width === width && current.height === height ? current : { width, height }));
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, [ref, enabled]);
    return size;
}
