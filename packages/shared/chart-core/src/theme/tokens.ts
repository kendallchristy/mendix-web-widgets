export type ThemeMode = "light" | "dark";

export type ThemePreset = "hyper" | "hyperLight" | "hyperDark" | "custom";

export type PaletteName = "theme" | "hyper" | "hyperHighContrast" | "monochrome" | "custom";

/** Everything the charts need to know about colour and type. */
export interface ChartTokens {
    mode: ThemeMode;
    palette: string[];
    /** Marks outside a highlight range. */
    muted: string;
    surface: string;
    text: string;
    label: string;
    grid: string;
    fontFamily: string;
    figuresFont: string;
    tooltipBackground: string;
    tooltipBorder: string;
    tooltipText: string;
    pillBackground: string;
    pillText: string;
    lightPillBackground: string;
    lightPillText: string;
    up: string;
    down: string;
    /** Opacity of the glow under marks and the top of a gradient area fill. */
    glowOpacity: number;
}

// Both palettes are checked for colour-blind separation between neighbouring series and for lightness
// against their surface. Light colours are sampled from the Hyper charts reference.
export const PALETTES: Record<Exclude<PaletteName, "theme" | "custom">, Record<ThemeMode, string[]>> = {
    hyper: {
        light: ["#8038D0", "#F87800", "#0860F8", "#48B840", "#BD16CE", "#D99A00", "#E5466F", "#0F8FC4"],
        dark: ["#9458E8", "#E06C00", "#3D7DF5", "#3DA336", "#C43BD6", "#B88200", "#E0506F", "#1590C8"]
    },
    hyperHighContrast: {
        light: ["#8038D0", "#F27300", "#0860F8", "#3FA637", "#BD16CE", "#C98A00", "#E0405F", "#0E86B8"],
        dark: ["#9458E8", "#E06C00", "#3D7DF5", "#3DA336", "#C43BD6", "#B88200", "#E0506F", "#1590C8"]
    },
    monochrome: {
        light: ["#5B21B6", "#7C3AED", "#8B5CF6", "#A78BFA", "#C4B5FD", "#4C1D95", "#6D28D9", "#DDD6FE"],
        dark: ["#C4B5FD", "#A78BFA", "#8B5CF6", "#7C3AED", "#6D28D9", "#DDD6FE", "#5B21B6", "#4C1D95"]
    }
};

const MONO = '"JetBrains Mono", "Geist Mono", "SFMono-Regular", Menlo, Consolas, monospace';
const SANS = 'Inter, "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", Arial, sans-serif';

export const HYPER_LIGHT: ChartTokens = {
    mode: "light",
    palette: PALETTES.hyper.light,
    muted: "#C9CCD6",
    surface: "#FFFFFF",
    text: "#111318",
    label: "#8A8F9C",
    grid: "#EEF0F4",
    fontFamily: SANS,
    figuresFont: MONO,
    tooltipBackground: "#FFFFFF",
    tooltipBorder: "#ECEEF3",
    tooltipText: "#111318",
    pillBackground: "#111318",
    pillText: "#FFFFFF",
    lightPillBackground: "#FFFFFF",
    lightPillText: "#111318",
    up: "#20A33A",
    down: "#E5484D",
    glowOpacity: 0.25
};

export const HYPER_DARK: ChartTokens = {
    mode: "dark",
    palette: PALETTES.hyper.dark,
    muted: "#3A4060",
    surface: "#141827",
    text: "#F2F4F8",
    label: "#8A91AD",
    grid: "#232842",
    fontFamily: SANS,
    figuresFont: MONO,
    tooltipBackground: "#1E2338",
    tooltipBorder: "#2C3250",
    tooltipText: "#F2F4F8",
    pillBackground: "#F2F4F8",
    pillText: "#111318",
    lightPillBackground: "#1E2338",
    lightPillText: "#F2F4F8",
    up: "#47CD89",
    down: "#F97066",
    glowOpacity: 0.4
};

/** Token values set in the app's CSS. Only what is set is returned. */
export type CssTokens = Partial<Omit<ChartTokens, "glowOpacity">>;

const CSS_TOKEN_NAMES: Array<[Exclude<keyof CssTokens, "palette" | "mode">, string]> = [
    ["fontFamily", "--hc-font-family"],
    ["figuresFont", "--hc-font-figures"],
    ["text", "--hc-text-color"],
    ["label", "--hc-label-color"],
    ["grid", "--hc-grid-color"],
    ["muted", "--hc-muted-color"],
    ["surface", "--hc-surface"]
];

/** Reads the `--hc-*` custom properties that apply to an element. */
export function readCssTokens(element: Element): CssTokens {
    const style = getComputedStyle(element);
    const read = (name: string): string | undefined => style.getPropertyValue(name).trim() || undefined;
    const tokens: CssTokens = {};

    const mode = read("--hc-mode");
    if (mode === "light" || mode === "dark") {
        tokens.mode = mode;
    }

    const colors: string[] = [];
    for (let i = 1; i <= 8; i++) {
        const color = read(`--hc-color-${i}`);
        if (!color) {
            break;
        }
        colors.push(color);
    }
    if (colors.length > 0) {
        tokens.palette = colors;
    }

    for (const [key, name] of CSS_TOKEN_NAMES) {
        const value = read(name);
        if (value) {
            tokens[key] = value;
        }
    }
    return tokens;
}

export function parseColorList(text: string | undefined): string[] {
    return (text ?? "")
        .split(/[,\s]+/)
        .map(color => color.trim())
        .filter(Boolean);
}

export interface ResolveTokensOptions {
    preset: ThemePreset;
    palette: PaletteName;
    customPalette?: string;
    css?: CssTokens;
    /** Series colours from a custom theme JSON, used when the preset is custom. */
    customThemePalette?: string[];
}

/**
 * Combines the base theme, the app's CSS tokens and the palette property into the tokens a chart draws with.
 * A custom theme starts from Hyper so anything its JSON leaves out still looks right.
 */
export function resolveTokens({
    preset,
    palette,
    customPalette,
    css = {},
    customThemePalette
}: ResolveTokensOptions): ChartTokens {
    const mode: ThemeMode = preset === "hyperLight" ? "light" : preset === "hyperDark" ? "dark" : (css.mode ?? "light");
    const base = mode === "dark" ? HYPER_DARK : HYPER_LIGHT;
    const themeColors = preset === "custom" && customThemePalette ? { palette: customThemePalette } : {};
    const tokens: ChartTokens = { ...base, ...themeColors, ...css, mode };

    if (palette === "custom") {
        const colors = parseColorList(customPalette);
        if (colors.length > 0) {
            tokens.palette = colors;
        }
    } else if (palette !== "theme") {
        tokens.palette = PALETTES[palette][mode];
    }
    return tokens;
}

/** Applies an alpha to a hex colour. Other colour formats are returned unchanged. */
export function withAlpha(color: string, alpha: number): string {
    const rgb = parseHex(color);
    if (!rgb) {
        return color;
    }
    return `rgba(${rgb.join(", ")}, ${Math.max(0, Math.min(1, alpha))})`;
}

function parseHex(color: string): [number, number, number] | undefined {
    const hex = color.trim().replace(/^#/, "");
    const full =
        hex.length === 3
            ? hex
                  .split("")
                  .map(c => c + c)
                  .join("")
            : hex.slice(0, 6);
    if (!/^[0-9a-f]{6}$/i.test(full)) {
        return undefined;
    }
    return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}

/** Mixes two hex colours; `amount` 0 gives `a`, 1 gives `b`. Non-hex colours return `a`. */
export function mixColors(a: string, b: string, amount: number): string {
    const ca = parseHex(a);
    const cb = parseHex(b);
    if (!ca || !cb) {
        return a;
    }
    const mixed = ca.map((v, i) => Math.round(v + (cb[i] - v) * amount));
    return `#${mixed.map(v => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Whichever of two inks reads better on a background colour, by WCAG contrast. Non-hex colours get `light`. */
export function readableInk(background: string, dark: string, light: string): string {
    const luminance = (color: string): number | undefined => {
        const rgb = parseHex(color);
        if (!rgb) {
            return undefined;
        }
        const [r, g, b] = rgb.map(v => {
            const c = v / 255;
            return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const bg = luminance(background);
    const d = luminance(dark);
    const l = luminance(light);
    if (bg === undefined || d === undefined || l === undefined) {
        return light;
    }
    const contrast = (a: number, b: number): number => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    return contrast(bg, d) > contrast(bg, l) ? dark : light;
}
