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

## 0.1.1 corrections

Four defects found by the first product adoptions of 0.1.0, corrected in package 0.1.1. The token set is unchanged: `tokens.version` stays `0.1.0`, the sheet is still byte-identical to the baseline, and the package version and the token set version now differ on purpose (see [architecture](../../architecture.md#decisions)). Uncommitted on UI `main` (base `eb208c2`); nothing pushed, published or re-vendored into a consumer by this step.

| Defect | Found by | Correction | Proved by (failing first) |
| --- | --- | --- | --- |
| The partial-results message listed product ids (`delegate`) although the consumer passes display names in `products` | Workspace (its shared UI adoption findings) | `NoticeList.partial()` names each unreachable product by its display name, the id only when no name is given, in the entry and the inbox | `tests/notifications-reach.test.mjs` (named, unnamed fallback, inbox); acceptance `partial` mode on both pages, panel and inbox |
| A count bounded by Beyond Projects (`{ unread 0–99, more, sources }`, `more: true` at the scan bound) rendered "N" below 99; `sources` was not read as the partial signal | Accounts and Snapshots (their adoption records), against the Projects contract; the `sources` shape from the Projects and CDN reports | The summary accepts `more` (count shown "N+" for any N, the bell named "N or more unread") and `sources` with `state: 'unavailable'` in summary and list, beside the earlier `{ unread, available, unavailable }` (both read together, ids once). A partial summary sets `data-state="partial"`; new read-only `more` and `missing`. New label `badge({ count, more })`; `button` receives `more`. Types: `NoticeSource`, `NoticeSummary.more/sources`, `NoticePage.sources` | Unit: bounded "2+" and exact below the bound, "99+" for an unbounded 150, 0 hides the badge, partial from `sources` and from `unavailable`, available sources not partial, EN/ES labels; acceptance `bound` mode ("2+", name says so) in DOM and React (Spanish) |
| React `NotificationEntry` `onView` left the panel open and React could not close it | Workspace | "View all" (a plain primary click) closes the panel and returns focus to the bell before following `href` or calling `onview`; a modified click leaves it. React ref (`NotificationEntryHandle`) adds `open()`, `close()`, `more` and `expanded`. `Disclosure.close()` from code returns focus to its button when focus was inside the panel (a press outside still leaves focus to the press) | Unit: DOM view-all (modified click negative), React view-all and ref close, Disclosure focus rule; acceptance on all three consumers, and ref close in React 19 and 18 |
| The dialog body did not scroll on its own; the whole dialog scrolled, taking the title and actions out of view | Workspace | The body is the flexible, scrolling part (`min-height: 0`, `overflow-y: auto`, contained overscroll); head, description and actions keep their size; on viewports under 20 rem the whole dialog scrolls instead | Acceptance `long dialog` on all three consumers at 320 × 568 and at 640 × 450, device scale 2 (200 % zoom): failed before the change (the body did not scroll, the title was 3367 px above the viewport), passes after; title and actions stay put while the body scrolls, no sideways scroll |

Executed on the same machine and toolchain as 0.1.0 (Node.js 22.21.1, Chrome 153.0.8010.53, playwright-core 1.63.0, React 19.3.0 and 18.3.1, TypeScript 7.0.2).

| Check | Result |
| --- | --- |
| `npm test` | 68/68: tokens 8, sources 4, controls 13, dialog 10, picker 7, collection 5, notifications 7, notification reach 6, React adapter on React 19 8 |
| `npm run types` (the typed consumers now use `more`, `missing`, `sources`, `badge` and the ref's `open`/`close`/`expanded`; before the declarations they failed with 8 errors) | Passed |
| `npm run acceptance` | 57/57: plain DOM 23, React 19 23, React 18 11; passed on three consecutive complete runs after the long-dialog check awaited the dialog's entering animation (one earlier run measured the title mid-animation and failed by a fraction of a pixel) |

Final tarball: `dist-pack/beyond-ui-0.1.1.tgz`, integrity `sha512-HCl9G+D7emCuIo+GSj4vy/zPx2WfxECsOopSmarf8H3RYbAGoPwYkr0ch0PrdbiwSGELf/8E306ux1sFcQX6/g==`, 73 entries (0.1.0's plus `src/dom/notifications/reach.js`); the acceptance run packed the same integrity. `dist-pack/beyond-ui-0.1.0.tgz` is kept beside it: the pack script names tarballs by version and does not expect a single one.

Not established: the corrections ran only against fixture adapters and fixture pages; no consumer has re-vendored 0.1.1, so no product browser result exists for them, and the workarounds the consumers recorded (Workspace's remount to close the entry and its own `overflow: auto` on the dialog body) remain until their owners adopt 0.1.1. A Projects summary with both `unavailable` and `sources` is read as their union, which no consumer has been seen sending.

**Family reference synchronization — blocked (partial):** the modeled `notices` journey (`branding/src/family/journeys/notices.js`) states no count form, partial wording or dialog scrolling, so it keeps its meaning. The shared component catalog, its states and consumers in Branding (the "N+" count, partial by display name, "View all" closing the panel, the scrolling dialog body) and the package version it cites belong to the Branding owner's wave-2 assignment, which this step was not authorized to change (only `ui/` was in scope). Reference 0.2.0, token set 0.1.0 (proposed, unchanged), UI 0.1.1 uncommitted.

## 0.1.2 corrections

One defect in the React adapter, found by CDN (`cdn-v2` `3ad4310`, which binds the DOM `Dialog` class itself in both management applications as its workaround), corrected in package 0.1.2. No public signature changed; the token set is unchanged (`tokens.version` `0.1.0`, sheet byte-identical to the baseline). Uncommitted on UI `main` (base `23c7268`); nothing pushed or published.

| Defect | Correction | Proved by (failing first) |
| --- | --- | --- |
| The React `Dialog` kept its DOM dialog in state and reported every settled close as the person closing it, `onClose(null)`, including a dialog destroyed while open and one opened after being destroyed (whose `open()` resolves `null` at once). React's development double mount destroys and recreates the dialog, and under an ancestor that uses `useSyncExternalStore` React 18 renders the destroyed one first: the owner received `onClose` as the dialog mounted, and the dialog vanished before any field could be filled. On React 19 the same fault reported a close whenever a shaping prop replaced an open dialog or its owner unmounted it | The adapter reports only results of the dialog it holds (a ref set when created and cleared in the cleanup before `destroy()`), clears its state in the cleanup as `useInstance` does, never opens, changes or portals into a destroyed dialog, and silences each opening that `open` closed. The audit of the other adapters found the same destroyed-instance pattern: under React 18, `Header` (`context`, `nav`), `ActionMenu` (`items`), `Tooltip` (`text`), `Collection` (`state`, which loaded again) and `NotificationInbox` (`state`, which loaded again) applied props to the destroyed instance. `useInstance` now returns null for a destroyed instance, so no adapter applies props to it, portals into it or calls through it from a ref (`Picker`, `NotificationEntry`); `useSync` skips a destroyed instance; `Tooltip` and `useToaster` clear their state in the cleanup, and the toaster's `show` and `clear` never reach a destroyed region. `useConfirm` and the questions hold no instance across renders (each question creates, opens and destroys its own dialog), so they needed no change | `tests/strict.test.mjs` under `StrictMode` inside an external-store provider: a dialog mounted open stays open with focus in its field and reports only Escape; a replaced dialog and an unmounted one report nothing; a dialog closed through `open` and opened again reports only the person closing it; every adapter (with `tests/support/touches.mjs` recording any call on a destroyed instance) leaves destroyed instances untouched. Before the correction: React 19 failed the replacement case (`[null]`); React 18 failed all four (`[null]`, `[null, null]`, `[null]`, and eight calls on destroyed instances). Browser: the new `store.html` page (`acceptance/checks/strict.mjs`) failed both checks on React 18 before the correction (the dialog was gone) |

The React suites now also run on React 18: `tests/react18.test.mjs` installs React 18.3.1 into a temporary project and runs `react.test.mjs` and `strict.test.mjs` in a child process whose `react` and `react-dom` resolve there (`tests/support/react.mjs`).

Executed on the same machine and toolchain as 0.1.1 (Node.js 22.21.1, Chrome 153.0.8010.53, playwright-core 1.63.0, React 19.3.0 and 18.3.1, TypeScript 7.0.2).

| Check | Result |
| --- | --- |
| `npm test` | 76/76 (74 top-level): tokens 8, sources 4, controls 13, dialog 10, picker 7, collection 5, notifications 7, notification reach 6, React adapter on React 19 8, StrictMode under an external store on React 19 5, and the React 18 run (1 with 2 subtests: `react.test.mjs` 8/8 and `strict.test.mjs` 5/5 on React 18.3.1) |
| `npm run types` | Passed |
| `npm run acceptance` | 61/61: plain DOM 23, React 19 25, React 18 13; two complete runs, the second after the last source change |

Final tarball: `dist-pack/beyond-ui-0.1.2.tgz`, integrity `sha512-CfN9AmCOC2EpcdiHUw5F+2A2a/HVxdgy9ecTLT3DzAOn21FP2zrk1LgVgHrdgduXIVucD8fXqS8xyYuK+trBeQ==`, 73 entries; the second acceptance run packed the same integrity.

Not established: CDN stays on 0.1.1 with its own `StrictMode`-safe binding of the DOM `Dialog` until its release owner re-vendors; whether React 19 can render a destroyed instance in some other schedule was not observed (the tests prove it no longer matters).

**Family reference synchronization — no reference impact:** the correction restores the dialog behavior the reference already models (a dialog stays open until the person closes it); no surface, journey, state or refusal meaning changes. The version Branding cites in its component catalog moves to 0.1.2 with its re-vendoring. Reference 0.3.1, token set 0.1.0 (proposed, unchanged), UI 0.1.2 uncommitted.
