# Changesets

Every pull request that changes a widget needs a changeset: a small Markdown file that says which widgets changed, whether the change is a patch, minor or major, and one line for the changelog. Create one with:

```sh
pnpm changeset
```

When changesets reach `main`, the release workflow opens a "Version widgets" pull request that bumps versions and writes the changelogs. Merging that pull request publishes a GitHub release with the `.mpk` for each widget that changed.
