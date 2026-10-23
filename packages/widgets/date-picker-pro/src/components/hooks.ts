import { useCallback, useSyncExternalStore } from "react";

/** Tracks a CSS media query, for the mobile layout. */
export function useMediaQuery(query: string): boolean {
    const subscribe = useCallback(
        (onChange: () => void) => {
            const list = window.matchMedia?.(query);
            list?.addEventListener?.("change", onChange);
            return () => list?.removeEventListener?.("change", onChange);
        },
        [query]
    );
    return useSyncExternalStore(
        subscribe,
        () => !!window.matchMedia?.(query).matches,
        () => false
    );
}

export function fillCount(text: string, count: number | undefined): string {
    return text.replace(/\{count\}/g, String(count ?? ""));
}
