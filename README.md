# Mendix Web Widgets

Custom [Mendix pluggable widgets](https://docs.mendix.com/apidocs-mxsdk/apidocs/pluggable-widgets/) by Kendall Christy, written in TypeScript and React.

## Widgets

| Widget     | Package | Description |
| ---------- | ------- | ----------- |
| _None yet_ |         |             |

Download a widget's `.mpk` from [Releases](https://github.com/kendallchristy/mendix-web-widgets/releases) and add it to your Mendix app's `widgets` folder.

## Repository layout

```text
packages/
  widgets/      One folder per widget. Each builds its own .mpk.
  shared/       Code shared between widgets, such as hooks and UI pieces.
  templates/    The starting point that `pnpm new-widget` copies.
scripts/        Repo tooling: widget generator, version sync, release.
.changeset/     Pending version bumps and changelog entries.
```

The setup follows [mendix/web-widgets](https://github.com/mendix/web-widgets), the repo Mendix uses for its own platform widgets, with less automation since this repo has one maintainer and no Marketplace pipeline.

## Getting started

You need Node.js 22 (see `.nvmrc`) and pnpm 10. With [Corepack](https://nodejs.org/api/corepack.html), `corepack enable` picks up the pnpm version from `package.json`.

```sh
pnpm install
pnpm build        # build every widget
pnpm test         # unit tests
pnpm lint         # ESLint
pnpm typecheck    # TypeScript
pnpm format       # Prettier
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to create a widget, try it in Studio Pro, and release it.

## License

[Apache 2.0](LICENSE)
