import {
    HYPER_DARK,
    HYPER_LIGHT,
    PALETTES,
    mixColors,
    parseColorList,
    readCssTokens,
    resolveTokens,
    withAlpha
} from "../theme/tokens";

describe("resolveTokens", () => {
    it("uses Hyper light by default", () => {
        const tokens = resolveTokens({ preset: "hyper", palette: "theme" });
        expect(tokens.mode).toBe("light");
        expect(tokens.palette).toEqual(PALETTES.hyper.light);
        expect(tokens.surface).toBe(HYPER_LIGHT.surface);
    });

    it("follows --hc-mode for the Hyper preset", () => {
        const tokens = resolveTokens({ preset: "hyper", palette: "theme", css: { mode: "dark" } });
        expect(tokens.mode).toBe("dark");
        expect(tokens.palette).toEqual(PALETTES.hyper.dark);
        expect(tokens.surface).toBe(HYPER_DARK.surface);
    });

    it("ignores --hc-mode when the preset fixes the mode", () => {
        expect(resolveTokens({ preset: "hyperLight", palette: "theme", css: { mode: "dark" } }).mode).toBe("light");
        expect(resolveTokens({ preset: "hyperDark", palette: "theme" }).mode).toBe("dark");
    });

    it("lets CSS tokens override the theme", () => {
        const tokens = resolveTokens({
            preset: "hyper",
            palette: "theme",
            css: { palette: ["#111111"], grid: "#222222" }
        });
        expect(tokens.palette).toEqual(["#111111"]);
        expect(tokens.grid).toBe("#222222");
    });

    it("lets the Palette property override CSS colours", () => {
        const tokens = resolveTokens({ preset: "hyper", palette: "hyperHighContrast", css: { palette: ["#111111"] } });
        expect(tokens.palette).toEqual(PALETTES.hyperHighContrast.light);
    });

    it("uses custom colours, falling back to the theme when none are given", () => {
        expect(
            resolveTokens({ preset: "hyper", palette: "custom", customPalette: "#010101, #020202" }).palette
        ).toEqual(["#010101", "#020202"]);
        expect(resolveTokens({ preset: "hyper", palette: "custom", customPalette: " " }).palette).toEqual(
            PALETTES.hyper.light
        );
    });

    it("takes colours from a custom theme, below the CSS tokens", () => {
        const fromTheme = resolveTokens({ preset: "custom", palette: "theme", customThemePalette: ["#333333"] });
        expect(fromTheme.palette).toEqual(["#333333"]);
        const fromCss = resolveTokens({
            preset: "custom",
            palette: "theme",
            customThemePalette: ["#333333"],
            css: { palette: ["#444444"] }
        });
        expect(fromCss.palette).toEqual(["#444444"]);
    });
});

describe("readCssTokens", () => {
    it("reads the --hc-* properties set on an element", () => {
        const element = document.createElement("div");
        element.style.setProperty("--hc-mode", "dark");
        element.style.setProperty("--hc-color-1", "#aa0000");
        element.style.setProperty("--hc-color-2", "#00aa00");
        element.style.setProperty("--hc-grid-color", "#cccccc");
        document.body.appendChild(element);

        expect(readCssTokens(element)).toEqual({ mode: "dark", palette: ["#aa0000", "#00aa00"], grid: "#cccccc" });
        element.remove();
    });

    it("ignores an unknown mode", () => {
        const element = document.createElement("div");
        element.style.setProperty("--hc-mode", "sepia");
        expect(readCssTokens(element)).toEqual({});
    });
});

describe("colour helpers", () => {
    it("applies alpha to hex colours", () => {
        expect(withAlpha("#ff8000", 0.5)).toBe("rgba(255, 128, 0, 0.5)");
        expect(withAlpha("#f80", 1)).toBe("rgba(255, 136, 0, 1)");
        expect(withAlpha("red", 0.5)).toBe("red");
    });

    it("mixes hex colours", () => {
        expect(mixColors("#000000", "#ffffff", 0.5)).toBe("#808080");
        expect(mixColors("red", "#ffffff", 0.5)).toBe("red");
    });

    it("splits colour lists on commas and spaces", () => {
        expect(parseColorList(" #111, #222  #333 ")).toEqual(["#111", "#222", "#333"]);
        expect(parseColorList(undefined)).toEqual([]);
    });
});
