// Publishes a GitHub release with the .mpk for every widget whose current
// version has no release yet. Runs on main after a "Version widgets" pull
// request is merged. Pass --dry-run to only print what would be released.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

import { readPackageJson, root, widgetDirs } from "./widgets.mjs";

const dryRun = process.argv.includes("--dry-run");
const run = (cmd, args, options = {}) => execFileSync(cmd, args, { cwd: root, encoding: "utf8", ...options });

function releaseExists(tag) {
    try {
        run("gh", ["release", "view", tag], { stdio: "ignore" });
        return true;
    } catch {
        return false;
    }
}

/** The changelog section for one version, without its heading. */
function releaseNotes(dir, version) {
    const changelog = readFileSync(join(dir, "CHANGELOG.md"), "utf8");
    const start = changelog.indexOf(`## ${version}\n`);
    if (start === -1) {
        return "";
    }
    const body = changelog.slice(start).split("\n").slice(1).join("\n");
    const next = body.search(/^## /m);
    return (next === -1 ? body : body.slice(0, next)).trim();
}

for (const dir of widgetDirs()) {
    const pkg = readPackageJson(dir);
    const tag = `${basename(dir)}-v${pkg.version}`;
    if (!dryRun && releaseExists(tag)) {
        continue;
    }

    console.log(`Releasing ${tag}`);
    // Through turbo, so shared packages the widget imports are built first.
    run("pnpm", ["exec", "turbo", "run", "release", `--filter=${pkg.name}`], { stdio: "inherit" });
    const mpk = join(dir, "dist", pkg.version, `${pkg.packagePath}.${pkg.widgetName}.mpk`);
    if (!existsSync(mpk)) {
        throw new Error(`Expected ${mpk} after the release build`);
    }

    const notesFile = join(tmpdir(), `${tag}.md`);
    writeFileSync(notesFile, releaseNotes(dir, pkg.version) || "No changelog entry.");
    const title = `${pkg.widgetName} ${pkg.version}`;
    if (dryRun) {
        console.log(`Would create release "${title}" with ${mpk} and notes:\n${readFileSync(notesFile, "utf8")}`);
        continue;
    }
    run("gh", ["release", "create", tag, mpk, "--title", title, "--notes-file", notesFile, "--target", "main"], {
        stdio: "inherit"
    });
}
