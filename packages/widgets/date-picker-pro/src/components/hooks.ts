import { useEffect, useState } from "react";

/** Tracks a CSS media query, for the mobile layout. */
export function useMediaQuery(query: string): boolean {
    const get = (): boolean => typeof window !== "undefined" && !!window.matchMedia?.(query).matches;
    const [matches, setMatches] = useState(get);
    useEffect(() => {
        const list = window.matchMedia?.(query);
        if (!list) {
            return;
        }
        const update = (): void => setMatches(list.matches);
        update();
        list.addEventListener?.("change", update);
        return () => list.removeEventListener?.("change", update);
    }, [query]);
    return matches;
}

export function fillCount(text: string, count: number | undefined): string {
    return text.replace(/\{count\}/g, String(count ?? ""));
}
