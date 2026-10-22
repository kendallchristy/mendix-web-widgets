// Shared helpers for the repo scripts.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const root = fileURLToPath(new URL("..", import.meta.url));

/** Every widget package directory, optionally including the template. */
export function widgetDirs({ includeTemplate = false } = {}) {
    const dirs = [];
    const widgetsRoot = join(root, "packages/widgets");
    if (existsSync(widgetsRoot)) {
        for (const entry of readdirSync(widgetsRoot, { withFileTypes: true })) {
            if (entry.isDirectory() && existsSync(join(widgetsRoot, entry.name, "package.json"))) {
                dirs.push(join(widgetsRoot, entry.name));
            }
        }
    }
    if (includeTemplate) {
        dirs.push(join(root, "packages/templates/widget"));
    }
    return dirs;
}

export function readPackageJson(dir) {
    return JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
}

/** The `version` attribute of the clientModule element in src/package.xml. */
export const clientModuleVersion = /(<clientModule\b[^>]*\bversion=")([^"]*)(")/;
