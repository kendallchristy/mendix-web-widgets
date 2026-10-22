import type { RefObject } from "react";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";

import type { ChartTokens, CssTokens, PaletteName, ThemePreset } from "../theme/tokens";
import { readCssTokens, resolveTokens } from "../theme/tokens";

const OBSERVED_ATTRIBUTES = ["class", "style", "data-theme", "data-mode"];

/**
 * Calls `onChange` when the page's dark-mode switch might have flipped: a class, style or data-theme change on
 * `<html>` or `<body>`. Apps that toggle a dark-mode class need nothing else.
 */
export function usePageThemeChanges(onChange: () => void): void {
    useEffect(() => {
        if (typeof MutationObserver === "undefined") {
            return;
        }
        const observer = new MutationObserver(onChange);
        for (const target of [document.documentElement, document.body]) {
            if (target) {
                observer.observe(target, { attributes: true, attributeFilter: OBSERVED_ATTRIBUTES });
            }
        }
        return () => observer.disconnect();
    }, [onChange]);
}

function sameTokens(a: CssTokens, b: CssTokens): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

export interface UseChartTokensOptions {
    preset: ThemePreset;
    palette: PaletteName;
    customPalette?: string;
    customThemePalette?: string[];
}

/** The tokens a chart draws with, kept in step with the app's CSS tokens and dark-mode class. */
export function useChartTokens(ref: RefObject<HTMLElement | null>, options: UseChartTokensOptions): ChartTokens {
    const [css, setCss] = useState<CssTokens>({});

    const [refresh] = useState(() => () => {
        const element = ref.current;
        if (element) {
            const next = readCssTokens(element);
            setCss(current => (sameTokens(current, next) ? current : next));
        }
    });

    // Read before the first paint so a dark page never flashes a light chart.
    useLayoutEffect(refresh, [refresh]);
    usePageThemeChanges(refresh);

    const { preset, palette, customPalette, customThemePalette } = options;
    return useMemo(
        () => resolveTokens({ preset, palette, customPalette, customThemePalette, css }),
        [preset, palette, customPalette, customThemePalette, css]
    );
}
