---
"@its/glowup-ui": patch
---

Stop publishing source maps. The tarball goes from 706 files / 2.54 MB unpacked to 406 files
/ 1.47 MB (0.46 MB → 0.26 MB compressed) — the maps were 300 files and 1.05 MB of it.

`sourceMaps: false` on bob's commonjs and module targets removes the `.js.map` files and the
`//# sourceMappingURL` comments that referenced them. bob's typescript target passes
`--declarationMap` unconditionally, so the `.d.ts.map` files are still generated; they are
excluded from the package (`!**/*.map` in `files`) and a post-build step deletes them along
with the comments in the shipped `.d.ts` files, so nothing in the tarball points at a map
that consumers do not receive.

Note for anyone who relied on them: `src` is still published, so types and runtime code are
unchanged — only stepping into the original sources through a source map is gone.
