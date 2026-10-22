// Checks that each widget's package.json, package.xml and widget XML agree, so
// Studio Pro can load the .mpk.
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { clientModuleVersion, readPackageJson, root, widgetDirs } from "./widgets.mjs";

let failures = 0;

for (const dir of widgetDirs({ includeTemplate: true })) {
    const name = relative(root, dir);
    const fail = message => {
        console.error(`✗ ${name}: ${message}`);
        failures++;
    };

    const pkg = readPackageJson(dir);
    const { widgetName, packagePath, version } = pkg;
    if (!widgetName || !packagePath) {
        fail("package.json needs widgetName and packagePath");
        continue;
    }
    if (!pkg.config) {
        fail('package.json needs a "config" object (the widget build reads config.projectPath)');
    }

    const packageXml = readFileSync(join(dir, "src/package.xml"), "utf8");
    const xmlVersion = packageXml.match(clientModuleVersion)?.[2];
    if (xmlVersion !== version) {
        fail(`src/package.xml version ${xmlVersion} does not match package.json version ${version}`);
    }
    if (!packageXml.includes(`<clientModule name="${widgetName}"`)) {
        fail(`src/package.xml clientModule name should be ${widgetName}`);
    }
    const filesPath = `${packagePath.replace(/\./g, "/")}/${widgetName.toLowerCase()}/`;
    if (!packageXml.includes(`<file path="${filesPath}" />`)) {
        fail(`src/package.xml should list <file path="${filesPath}" />`);
    }

    const widgetXmlPath = join(dir, "src", `${widgetName}.xml`);
    if (!existsSync(widgetXmlPath)) {
        fail(`missing src/${widgetName}.xml`);
        continue;
    }
    const expectedId = `${packagePath}.${widgetName.toLowerCase()}.${widgetName}`;
    if (!readFileSync(widgetXmlPath, "utf8").includes(`id="${expectedId}"`)) {
        fail(`src/${widgetName}.xml should have id="${expectedId}"`);
    }

    if (!existsSync(join(dir, "CHANGELOG.md"))) {
        fail("missing CHANGELOG.md");
    }
}

if (failures > 0) {
    process.exit(1);
}
console.log("All widgets are consistent.");
