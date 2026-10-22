# Notes for Claude

- Monorepo of Mendix pluggable widgets: pnpm workspaces + Turborepo, TypeScript, React. Node 22, pnpm 10.
- Widgets live in `packages/widgets/<kebab-name>`; create them with `pnpm new-widget "Name"`, never by hand. The template is `packages/templates/widget`.
- The widget build is `@mendix/pluggable-widgets-tools` (rollup). It generates `typings/<Widget>Props.d.ts` from `src/<Widget>.xml`; rebuild after XML changes and commit the typings.
- Don't list `react`, `react-dom`, `@types/react` or `@types/react-dom` in a widget's package.json. The tooling provides them and its dependency check prompts interactively if they appear.
- Shared versions go in the `catalog` in `pnpm-workspace.yaml`, referenced as `"catalog:"`.
- Before pushing, run `pnpm format:check && pnpm verify && pnpm lint && pnpm typecheck && pnpm test`.
- Widget changes need a changeset in `.changeset/` (see `.changeset/README.md`). Versions in `src/package.xml` are synced from package.json by `scripts/sync-package-xml.mjs`; don't edit them by hand.
