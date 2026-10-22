import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

import { buildHyperTheme } from "../theme/echartsTheme";
import { themeBuilderConfig } from "../theme/themeBuilder";
import { HYPER_DARK, HYPER_LIGHT } from "../theme/tokens";

// The Hyper themes are published in docs/charts for the ECharts theme builder and for pasting into Theme JSON.
// This test keeps those files in step with the tokens. Run with UPDATE_THEME_FILES=1 to rewrite them.
const docs = join(__dirname, "../../../../../docs/charts/themes");

const files: Record<string, unknown> = {
    "hyper-light.json": buildHyperTheme(HYPER_LIGHT),
    "hyper-dark.json": buildHyperTheme(HYPER_DARK),
    "hyper-light.theme-builder.json": themeBuilderConfig(HYPER_LIGHT, "hyper-light"),
    "hyper-dark.theme-builder.json": themeBuilderConfig(HYPER_DARK, "hyper-dark")
};

describe("published theme files", () => {
    it.each(Object.keys(files))("%s matches the tokens", name => {
        const expected = JSON.stringify(files[name], null, 4) + "\n";
        const path = join(docs, name);
        if (process.env.UPDATE_THEME_FILES) {
            writeFileSync(path, expected);
        }
        expect(readFileSync(path, "utf8")).toBe(expected);
    });
});
