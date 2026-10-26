# Local UI 0.36.0: a row's current tab kept whole, and what a page scrolls to below the family bar

Evidence baseline: UI `d51fb6c` (0.35.0) on `feature/next`, then `fb3a407`, plus this branch (`claude/network-close-20261025`). It was made in a worktree on 2026-10-25 and 26 for the suite's round `network-close`, the machine Network's pendings `ui-tabs-current-under-arrow` and `ui-scroll-padding-without-compact`. It was rebased over 0.33.0, 0.34.0 and 0.35.0 as the rounds agreed the numbers.

## Why

Conduict's machine Settings row of tabs scrolled its current tab, Network, under the row's end cue at 390 and 320 px: the tab spanned 296–373 px while the cue covered 342–374 px. `ProductNav`'s scroll into view ignored the cues' width, against D179 (a visible action is named whole). And `compact.css` gave `scroll-padding-top` only to a page that draws a compact line. So on a page without one, such as Conduict's machine page, an address's target or a heading focused by code scrolled under the sticky family bar.

## What changed

- **The current tab, whole (D179).** `ProductNav`, and the `Tabs` built on it, keep the current tab clear of both ends' cues as they are drawn and of the row's padding (`ScrollEdges.reveal`, `RowClearance`). The row scrolls by whole pixels, never the page. It does so at once and again whenever the row or a tab changes size (a web font that loads, a narrower window), until the person scrolls the row themselves.
- **Targets below the family bar.** Every page with the family bar holds the bar in the document's `scroll-padding-top`, plus the sidebar's row below its cut unless the bar holds the sidebar. The compact line's height is added only where one is drawn. The sticky lines' own controls keep their scroll area below that padding, so focusing them moves nothing.
- **No API change.** No option, export, token or declaration changes; the token set stays 0.8.0.

## Executed checks

Every run went through the machine's test queue.

- **Unit suite:** `node --test "tests/*.test.mjs"` after the build, 967 of 967. New: `clearance.test.mjs` (8) and `targets.test.mjs` (3).
- **Declarations:** `npm run types` compiles.
- **Browser acceptance**, from the packed archive (`BEYOND_UI_TARBALL`), in the `dom`, `react19` and `react18` consumers, each reporting ui 0.36.0. The whole run, then the opening's checks:
  - Chrome 155: 436 of 436, and 28 of 28 opening checks.
  - Firefox: 436 of 436, and 28 of 28 opening checks.
  - WebKit: 436 of 436, and 28 of 28 opening checks.

  The new checks are `revealing.mjs`, every frame's current tab from the first paint through the fonts at 320, 390 and 1440 px, and `targeting.mjs`, an address's target, `scrollIntoView`, a heading focused by code, and sticky controls taking focus. Earlier, on 0.32.1, `targeting.mjs`'s checks failed against the base (`base-sticky`: 0 of 2), so they hold what they measure.

## Limits

This is package evidence only. Each product vendors 0.36.0 in its own repository. Conduict's network journey then lets a cut current tab fail it again, and Inbound drops its centred arrival. Nothing here is screen-reader output or hosted behavior.

## Family reference synchronization

The family reference (Beyond Suite's `branding/`) records the products' adoption in its round `mapped`, which the suite registers after its earlier rounds.

## Artifact

- Archive: `dist-pack/beyond-ui-0.36.0.tgz`, packed by `npm run pack:consumers` from `5ce61bd`. The rebase onto `fb3a407` changed only `AGENTS.md`, which the archive does not hold.
- SHA-256: `dc0ea52129b58e5bee54b5e3940df759ed54fad7644e8f8344f96b8037082176`.
- Integrity: `sha512-tcQ7AMl9ZXACCs3SSi7hWLdCaN70Lk0MV8F0JqwQzpYANxQoIl1H/ZsGCEdWjf4wD9Psq6312LIr7avpHuzMbg==`. This is byte for byte the archive the browser acceptance installed.
