# Working on widgets

## Create a widget

```sh
pnpm new-widget "Data Grid Pro" "A fast, dense data grid."
pnpm install
pnpm --filter @kendallchristy/data-grid-pro build
```

This copies `packages/templates/widget` to `packages/widgets/data-grid-pro` and renames everything. The widget's Studio Pro properties live in `src/<WidgetName>.xml`. The build generates matching TypeScript types in `typings/`, so rebuild after changing the XML. Commit the generated typings along with the XML.

Every widget uses the package path `com.kendallchristy.widget.web`, so its ID is `com.kendallchristy.widget.web.<lowercase name>.<WidgetName>`. Don't change a widget's name or ID after its first release, because Mendix apps that use it would lose their configuration.

## Try a widget in Studio Pro

Point the build at a Mendix app on your machine and it copies the `.mpk` into that app's `widgets` folder on every build:

```sh
MX_PROJECT_PATH="/path/to/MyApp" pnpm --filter @kendallchristy/data-grid-pro dev
```

On Windows PowerShell, set it first with `$env:MX_PROJECT_PATH="C:\path\to\MyApp"`. In Studio Pro, press F4 (Synchronize App Directory) to pick up the new version.

## Checks

CI runs these on every pull request, and you can run them locally:

| Command             | What it checks                                               |
| ------------------- | ------------------------------------------------------------ |
| `pnpm format:check` | Prettier formatting (`pnpm format` fixes it)                 |
| `pnpm verify`       | Each widget's package.json, package.xml and widget XML agree |
| `pnpm lint`         | ESLint                                                       |
| `pnpm typecheck`    | TypeScript                                                   |
| `pnpm test`         | Jest unit tests (`src/**/*.spec.tsx`)                        |
| `pnpm release`      | Production build of every `.mpk`                             |

## Release a widget

1. In the pull request that changes a widget, run `pnpm changeset`, pick the widget and the kind of change (patch, minor or major), and write one line for the changelog. Commit the generated file.
2. When that pull request is merged, the Release workflow opens a "Version widgets" pull request that bumps the version in `package.json` and `src/package.xml` and updates `CHANGELOG.md`.
3. Merging "Version widgets" creates a GitHub release named `<widget folder>-v<version>` with the production `.mpk` attached.

Pull requests opened by GitHub Actions don't trigger CI on their own. That's fine for "Version widgets", which only changes versions and changelogs.

## Shared code

Put code that two or more widgets need in a package under `packages/shared/`, named `@kendallchristy/<name>`, and depend on it with `"workspace:*"`. Keep a widget's code inside the widget until a second widget needs it.

## Dependency versions

Versions shared by all widgets (the Mendix tooling, TypeScript, testing libraries) live in the `catalog` section of `pnpm-workspace.yaml`. Widgets reference them as `"catalog:"`, so one edit upgrades every widget. Dependabot opens grouped upgrade pull requests monthly, with Mendix packages in their own group.
