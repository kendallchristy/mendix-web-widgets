// Creates a new widget package from packages/templates/widget.
// Usage: pnpm new-widget "Data Grid Pro" ["One line description"]
import { cpSync, existsSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

import { root } from "./widgets.mjs";

const [displayName, description] = process.argv.slice(2);
if (!displayName || !/^[A-Za-z][A-Za-z ]*$/.test(displayName)) {
    console.error('Usage: pnpm new-widget "Widget Name" ["Description"]  (letters and spaces only)');
    process.exit(1);
}

const words = displayName.trim().split(/\s+/);
const pascal = words.map(w => w[0].toUpperCase() + w.slice(1)).join("");
const kebab = words.map(w => w.toLowerCase()).join("-");
const lower = pascal.toLowerCase();

const templateDir = join(root, "packages/templates/widget");
const targetDir = join(root, "packages/widgets", kebab);
if (existsSync(targetDir)) {
    console.error(`${relative(root, targetDir)} already exists`);
    process.exit(1);
}

const skip = new Set(["node_modules", "dist", "typings"]);
cpSync(templateDir, targetDir, { recursive: true, filter: src => !skip.has(src.split(/[\\/]/).pop()) });

const replace = text =>
    text
        .replaceAll("TemplateWidget", pascal)
        .replaceAll("template-widget", kebab)
        .replaceAll("templatewidget", lower)
        .replaceAll("Template Widget", displayName.trim());

function walk(dir) {
    for (const name of readdirSync(dir)) {
        let path = join(dir, name);
        if (name.includes("TemplateWidget")) {
            const renamed = join(dir, replace(name));
            renameSync(path, renamed);
            path = renamed;
        }
        if (statSync(path).isDirectory()) {
            walk(path);
        } else if (!/\.(png|jpe?g|gif|ico|mpk)$/i.test(path)) {
            writeFileSync(path, replace(readFileSync(path, "utf8")));
        }
    }
}
walk(targetDir);

const pkgPath = join(targetDir, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.description = description ?? `${displayName.trim()} widget for Mendix.`;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 4) + "\n");

writeFileSync(join(targetDir, "CHANGELOG.md"), `# ${pkg.name}\n`);
writeFileSync(
    join(targetDir, "README.md"),
    `# ${displayName.trim()}\n\n${pkg.description}\n\n## Usage\n\nDescribe how to configure the widget in Studio Pro.\n`
);

console.log(`Created ${relative(root, targetDir)}. Next steps:
  pnpm install
  pnpm --filter ${pkg.name} build`);
