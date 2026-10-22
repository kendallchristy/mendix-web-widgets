// Copies each widget's package.json version into src/package.xml. Runs after
// `changeset version`, which only updates package.json.
import { readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

import { clientModuleVersion, readPackageJson, root, widgetDirs } from "./widgets.mjs";

for (const dir of widgetDirs({ includeTemplate: true })) {
    const { version } = readPackageJson(dir);
    const xmlPath = join(dir, "src/package.xml");
    const xml = readFileSync(xmlPath, "utf8");
    const updated = xml.replace(clientModuleVersion, `$1${version}$3`);
    if (updated !== xml) {
        writeFileSync(xmlPath, updated);
        console.log(`${relative(root, xmlPath)} -> ${version}`);
    }
}
