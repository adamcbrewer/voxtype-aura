# Agent Notes

## Marketplace Updates

After pushing any update intended for the Omarchy Plugin Marketplace, request
verification for the new exact commit. Tags and GitHub releases do not trigger
re-verification automatically.

Use the [Plugin verification form](https://github.com/omacom/omarchy-plugin-marketplace/issues/new?template=verify-plugin.yml)
with:

- Action: `Verify and publish a newer upstream commit`
- Plugin ID: `io.github.adamcbrewer.voxtype-aura`
- Repository: `https://github.com/adamcbrewer/voxtype-aura`
- Target commit: the full 40-character SHA of the current remote `main` HEAD

Wait for the automated checks and marketplace maintainer approval. Until the
new snapshot is promoted, the marketplace will correctly show
`Update unverified`.
