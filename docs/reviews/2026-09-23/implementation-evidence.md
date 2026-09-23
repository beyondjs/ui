# UI 0.1.0 implementation evidence — 2026-09-23

## Scope and state

Implementation of `@beyond-js/ui` 0.1.0 under the September 23 shared experience scope: token extraction from the family reference, the framework-free DOM core, the React adapter, one stylesheet, notification entry and inbox presentation, type declarations, tests and a vendorable tarball. Everything is **uncommitted** on UI `main` (base `ecf62eb`); nothing is pushed, published, deployed or hosted. The Branding side of the token move is uncommitted in Beyond Suite (base `7b9e47d`), where other sessions' uncommitted changes (including `branding/README.md`) were left untouched.

Executed on macOS with Node.js 22.21.1, npm 10.9.4, Google Chrome 153.0.8010.53, playwright-core 1.63.0, esbuild 0.28.2, happy-dom 20.14.5, TypeScript 7.0.2, React 19.3.0 and 18.3.1.

## Token extraction

- Before any change, Branding's `TokenSheet` output was captured from its own `src/foundations/` (158 lines, sha256 `a56d132c66b73c7be65bf70a82d491d554f6a29a1764b8a1914ec497b5c9676a`) as `tests/fixtures/branding-tokens-0.1.0.css`.
- The five foundation modules moved into `src/foundations/` with values unchanged, `version: '0.1.0'`, `status: 'proposed'` and `provenance` (origin `branding/src/foundations`, last changed at suite revision `4c47733631efa4f16fd04ebcb2867de5dbd5b8f1`, unchanged at `7b9e47d`). Only doc comments changed; the sheet header keeps its original wording so the output is byte-identical.
- `tests/tokens.test.mjs` asserts the generated sheet and the packed `dist/tokens.css` equal the baseline byte for byte, plus provenance, role resolution, primitive provenance, contrast in both themes and a negative case (a changed value changes the sheet).
- Branding now installs `tools/beyond-ui-0.1.0.tgz` as a devDependency; its `src/foundations/*.js` re-export `@beyond-js/ui/tokens` and hold no copy. Its lockfile gained the package entry (and npm corrected its stale `version` to 0.2.0); its original two-space indentation was kept. A new Branding test asserts the tokens are the installed package's objects. From Branding's own foundations the sheet was again byte-identical to the baseline. `branding/docs/foundations.md` states the move.

## Executed results

| Check | Result |
| --- | --- |
| UI `npm test` (build, then Node's test runner over happy-dom) | 60/60: tokens 8, sources 4, controls 12, dialog 10, picker 7, collection 5, notifications 7, React adapter on React 19 7 |
| UI `npm run types` (typed plain DOM and React consumers; a deliberate wrong option was confirmed to fail) | Passed |
| UI `npm run acceptance` (packed tarball installed into three temporary consumers, Chrome) | 49/49: plain DOM 20, React 19 20, React 18 9; passed on two consecutive complete runs |
| Branding `npm test` | 48/48 before any change; 49/49 after (the added consumption test) |
| Branding `npm run build` | Passed before and after |

The browser checks cover the action menu (ArrowDown, arrows, disabled reason, Escape focus return), dialog focus entry, Tab wrapping and focus restore, a busy confirmation that survives three Escapes and a backdrop press, keeps its failure and resolves on retry, prompt validation, picker selection across paging, a filter and a new query with the stale choice counted and submitted as hidden inputs, no matches, failure with retry, picker keyboard with a disabled option, the notification count and name, panel marking and forgetting its items, unavailable, failed-then-retried, partial and empty notification states, opening an item to its destination, inbox filtering, paging and grouping, help by keyboard and tap, tooltip by focus, Escape and touch press, 44 px touch targets, double-submission prevention, reduced motion, dark theme by attribute and by system preference with the attribute overriding, 320 px without sideways scroll and with the collapsing header, 200 % zoom (640 CSS px at device scale 2) with the dialog fitting, collection links, paging focus and clearing no matches, teardown leaving no component element and no component listener on `document` (via the Chrome DevTools protocol), and Spanish copy passed through `labels` (including Spanish relative times).

Final tarball: `dist-pack/beyond-ui-0.1.0.tgz`, integrity `sha512-Lluilj4b+E9WeFHURoUOaRpG9rxp5HppJJTZVtHhKar+nPBwgyWj7RGi29JgzY88V2w63xM7/IUmSEukwwj1QA==`, 73 files (`src/`, `types/`, the three generated `dist/` files, README and manifest). `npm pack` is reproducible: the acceptance run packed the same integrity.

## Not established

- No product consumes the components: Delegate, Branding views and every other product adoption is later work, and no product browser result exists.
- The notification components ran only against fixture adapters; no Projects service, product relay or real `beyond-notifications/1` answer was exercised. The adapter shapes follow the coordination summary; the Projects owner may refine names.
- Only Chrome was exercised; no other browser, no screen reader output, and zoom was approximated by viewport and device scale rather than browser zoom.
- The React adapter's unit tests ran on React 19 only; React 18 ran only in the browser subset of 9 checks.
- `closedby` and the class's own Escape handling keep busy dialogs open in Chrome 153; other engines' close-request behavior is unverified.
- The token values remain proposals awaiting owner approval; the extraction approves none of them.
- Branding's browser acceptance was not rerun: its tokens and sheet are byte-identical and no view changed.

## Family reference synchronization

**Synchronization blocked (partial):** the token source move is reflected in Branding (`src/foundations/`, `docs/foundations.md`, its test and its dependency) in this assignment. Remaining Branding statements that still name `src/foundations/` as the canonical source (its `AGENTS.md` token rule, `README.md`, `docs/architecture.md`, the manual's lead text in `src/app/reference/manual/foundations.js` and a comment in `src/app/styles/base.css`) and the component catalog, consumers and residual copies belong to the Branding owner's wave-2 assignment, which this assignment was not authorized to change. No surface, journey, finding or matrix row changed meaning: the reference renders identically. Reference 0.2.0, token set 0.1.0 (proposed), UI 0.1.0 uncommitted.
