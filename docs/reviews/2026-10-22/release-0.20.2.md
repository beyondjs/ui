# Local UI 0.20.2 verification

UI 0.20.2 includes the coordinated changes in [0.20.0](release-0.20.0.md) and the responsive PagePanel focus correction in [0.20.1](release-0.20.1.md). Its additional production change gives animated disclosures a focus-outline margin. The shared disclosure clips its animated contents without cutting the outline of a focused child control.

## Artifact and adoption

- Archive: `dist-pack/beyond-ui-0.20.2.tgz`.
- SHA-256: `e2e2cc5238571ceea3119a2c87bdfdd4433f0da4a6358325abebadded9dd8d4f`.
- Integrity: `sha512-edS+m1lWiBPjqTUK3V6ghE3x+lM/l69t7soCo/nyHnh/T/yXrn8Ek2wH+17/fPVYcGOlkN3Obs4zjZ50mFNirA==`.
- Token set: 0.6.0; public exports and types unchanged.
- Installed offline, with scripts disabled, in Conduict, Accounts, Projects, Snapshots, Delegate, CDN administration, CDN backoffice, Packages UI, Beyond Home, Workspace 2026, the family reference, Labs and Docs Site.
- Installed source, type and font files match the packed snapshot. All thirteen consumer archives match the hash above.

The release archive is immutable. Browser acceptance uses `BEYOND_UI_TARBALL=dist-pack/beyond-ui-0.20.2.tgz`; later documentation edits do not replace the archive.

## Executed checks

UI 0.20.2 passes all 746 unit tests. The disclosure margin is its only additional production change over 0.20.1; all eleven focused source and panel checks pass. Chrome on 0.20.1 passed 338 of 340 full-suite cases; the two failures were a TechnicalDetails fixture selector that assumed a direct child in React. The corrected selector passed all three DOM/React checks. These are separate runs, not a single full-suite pass.

Firefox on 0.20.2 passed 339 of 340 full-suite cases. The remaining sheet-motion fixture sampled its intermediate frame after a protocol round trip, which could outlast the exit. Sampling the close, intermediate frame and reversal in one browser callback passes all three DOM/React cases in Chrome, Firefox and WebKit. WebKit's full 0.20.2 run passed 340 of 340 cases before that harness correction. The corrected checks are separate runs; no single all-green Firefox full-suite result is claimed.

Conduict's final frontend unit run passes 996 tests. Home and the secret-editor fixture pass in Chrome with the installed 0.20.2 package. Home captures confirm an uncut focus outline on the common machine control. Product fixtures use real compiled interfaces and isolated API stand-ins; they do not establish provider integration.

## Running local instance

An HTTP check of the existing Conduict development instance found an installed 0.20.2 package but cached CSS from 0.20.0-rc.1. Triggering the existing Vite configuration watcher without changing source bytes refreshed that frontend. Its served CSS then matched the installed 0.20.2 stylesheet exactly, including the disclosure margin. The served UI prebundle matched the regenerated cache after import-URL normalization; all 247 mapped UI source files matched the installed package.

A separate browser tab with an existing session opened Home and the empty conversation list of an existing project. Search opened in place, and Escape restored its button's focus. This read-only check created no conversation, woke no machine and sent no message. The full installed browser matrix and remaining consumer checks are still in progress. No publication or owner acceptance is claimed.
