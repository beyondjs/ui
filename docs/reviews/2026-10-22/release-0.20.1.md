# Local UI 0.20.1 verification

UI 0.20.1 contains the coordinated changes described in [0.20.0](release-0.20.0.md), plus the responsive PagePanel focus correction. When a modal panel becomes a permanent aside, focus transfers after the native exit completes. With reduced motion, the transfer remains immediate.

## Artifact and adoption

- Local archive: `dist-pack/beyond-ui-0.20.1.tgz`.
- SHA-256: `869c73563dc7a0165303b6f930d80fd185273e4fb59a123fcc8bd36dfa1809f5`.
- Integrity: `sha512-iXiUr/0603TrXUVp11J9Hc+YpBbHxKZDPQeeJRvwgjL2h5k1NeGsnfrS4GFuzF/jWNX+7K7Wtma4LyMEU9DS9Q==`.
- Token set: 0.6.0; public exports and types unchanged.
- Installed offline, with scripts disabled, in Conduict, Accounts, Projects, Snapshots, Delegate, CDN administration, CDN backoffice, Packages UI, Beyond Home, Workspace 2026, the family reference, Labs and Docs Site.
- Every installed source, type and font file matches the packed source snapshot. Each consumer archive matches the archive hash above.

## Executed checks

The complete UI unit suite passes 746 tests. The focused native sheet animation check passes in DOM, React 19 and React 18 in Chrome. A new PagePanel regression covers focus after an animated responsive transition and retains immediate behavior without motion.

The browser runner accepts `BEYOND_UI_TARBALL=dist-pack/beyond-ui-0.20.1.tgz` to validate this exact archive instead of packing a new snapshot. Each case has a 120-second bound. The sheet reversal check starts opening without waiting for the promise that intentionally settles only on a later close.

## Remaining verification

The full installed browser matrix and product rendering checks are in progress. This checkpoint does not establish hosted behavior, provider integration, publication or owner acceptance. The earlier interrupted Chrome run belongs to 0.20.0 and is not a pass for this revision.
