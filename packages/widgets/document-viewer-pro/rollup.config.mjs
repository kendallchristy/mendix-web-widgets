// Adds the file-type engines to the standard widget build.
//
// Each engine (PDF, Word, spreadsheets, ...) is bundled into its own script under the widget's folder in the .mpk,
// for example widgets/com/kendallchristy/widget/web/documentviewerpro/engines/pdf.js. The widget loads an engine
// with a script tag the first time a file of that type opens, so a page that only shows PDFs never downloads the
// spreadsheet or PowerPoint code. The Mendix tooling bundles each widget into a single file and can't split code,
// which is why the engines are separate builds.
import { cpSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const toolsRequire = createRequire(require.resolve("@mendix/pluggable-widgets-tools/package.json"));
const load = async name => {
    const module = await import(pathToFileURL(toolsRequire.resolve(name)).href);
    return module.default ?? module;
};

const ENGINES = ["pdf", "docx", "sheet", "pptx", "tiff", "code", "markdown", "email"];
const widgetDir = "com/kendallchristy/widget/web/documentviewerpro";
const enginesDir = join("dist/tmp/widgets", widgetDir, "engines");

// Swaps Node-only packages for browser versions inside the engine bundles.
function browserShims() {
    const shims = { "iconv-lite": join(process.cwd(), "src/engines/shims/iconv-lite.ts") };
    return {
        name: "browser-shims",
        resolveId(source) {
            return shims[source] ?? null;
        }
    };
}

// Stamps the package version into the widget so engine URLs change with each release and caches never mix versions.
function versionStamp() {
    const { version } = JSON.parse(readFileSync("package.json", "utf8"));
    return {
        name: "version-stamp",
        renderChunk(code) {
            return code.includes("__DVP_VERSION__")
                ? { code: code.replaceAll("__DVP_VERSION__", JSON.stringify(version)), map: null }
                : null;
        }
    };
}

function copyPdfAssets() {
    const pdfjsRoot = dirname(require.resolve("pdfjs-dist/package.json"));
    return {
        name: "copy-pdfjs-assets",
        writeBundle() {
            const target = join(enginesDir, "pdfjs");
            mkdirSync(target, { recursive: true });
            // Saved as .js: the widget's only .mjs file should be the widget itself, which Studio Pro bundles.
            cpSync(join(pdfjsRoot, "legacy/build/pdf.worker.min.mjs"), join(target, "pdf.worker.min.js"));
            for (const folder of ["cmaps", "standard_fonts", "wasm", "iccs"]) {
                cpSync(join(pdfjsRoot, folder), join(target, folder), { recursive: true });
            }
            cpSync(join(pdfjsRoot, "LICENSE"), join(target, "LICENSE"));
        }
    };
}

export default async args => {
    const production = Boolean(args.configProduction);
    const defaults = args.configDefaultConfig;
    const [nodeResolve, commonjs, typescript, terser, replace, license] = await Promise.all([
        load("@rollup/plugin-node-resolve").then(m => m.nodeResolve ?? m),
        load("@rollup/plugin-commonjs"),
        load("@rollup/plugin-typescript"),
        load("@rollup/plugin-terser"),
        load("rollup-plugin-re"),
        load("rollup-plugin-license")
    ]);

    const engineConfigs = ENGINES.map((name, index) => ({
        input: `src/engines/${name}.ts`,
        output: {
            format: "iife",
            file: join(enginesDir, `${name}.js`),
            inlineDynamicImports: true,
            sourcemap: production ? false : "inline"
        },
        plugins: [
            browserShims(),
            nodeResolve({ preferBuiltins: false, browser: true, mainFields: ["module", "browser", "main"] }),
            commonjs({ transformMixedEsModules: true, requireReturnsDefault: "auto" }),
            typescript({
                noEmitOnError: !args.watch,
                sourceMap: !production,
                inlineSources: !production,
                target: "es2022",
                include: ["src/engines/**/*.ts", "typings/**/*.d.ts"]
            }),
            replace({
                patterns: [{ test: "process.env.NODE_ENV", replace: production ? "'production'" : "'development'" }]
            }),
            production ? terser() : null,
            license({
                thirdParty: { includePrivate: false, output: { file: join(enginesDir, `${name}.licenses.txt`) } }
            }),
            index === 0 ? copyPdfAssets() : null
        ],
        onwarn(warning, warn) {
            // pdf.js and PptxViewJS contain Node-only branches that reference eval and `this` at the top level.
            if (["EVAL", "THIS_IS_UNDEFINED", "CIRCULAR_DEPENDENCY"].includes(warning.code)) {
                return;
            }
            warn(warning);
        }
    }));

    // The widget builds clear the output folder when they start, and the last build packs the .mpk, so the engines
    // go after the widget builds and before the Studio Pro preview builds.
    for (const config of defaults) {
        config.plugins = [versionStamp(), ...(config.plugins ?? [])];
    }
    const lastWidgetBuild = defaults.findLastIndex(config => String(config.output?.file ?? "").endsWith(".mjs"));
    return [...defaults.slice(0, lastWidgetBuild + 1), ...engineConfigs, ...defaults.slice(lastWidgetBuild + 1)];
};
