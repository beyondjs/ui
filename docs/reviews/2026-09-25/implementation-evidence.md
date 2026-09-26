# @beyond-js/ui 0.1.4 — implementation evidence (September 25, 2026)

A correction the Beyond desktop found while adopting 0.1.3: an `ActionMenu` near the bottom of the viewport opened its list below the button, past the viewport's edge, and focusing its first item scrolled the nearest scroll container to reveal it. On the desktop, whose root is a clipped grid of the viewport's height, the shelf's "Arrange" menu scrolled the whole application up by 186 px, the top bar left the screen, and a second click at the same point landed on a menu item instead of the button. The change is additive in its API: one new option, and no existing signature changed. The token set is unchanged (`tokens.version` `0.1.0`, sheet byte-identical to the baseline).

| Change | Behavior | Proved by |
| --- | --- | --- |
| Focus never scrolls | Opening (click, ArrowDown, ArrowUp), moving between items (arrows, Home, End) and returning focus to the button (Escape, choosing) focus with `preventScroll: true` | `tests/controls.test.mjs` "moving focus into, within and out of the menu never scrolls anything" (every one of five focus calls carries `preventScroll`); `acceptance/checks/keyboard.mjs` "action menu at the bottom of the viewport" in Chrome on the DOM, React 19 and React 18 consumers |
| Placement inside the viewport | `placement: 'auto'` (default): below the button, or above it (`bui-menu-above`) when there is no room below and more room above. `'below'` and `'above'` fix the side. On every side the list is shifted sideways (`translate`) when an edge would cut it and capped (`max-height`, the list then scrolls) to the room left, keeping 8 px from the viewport's edges. It is placed again each time it opens. The enter animation moves toward the button on both sides (`--bui-enter-from`) | `tests/controls.test.mjs` "the list opens on the side with room and stays inside the viewport" (above without room below, below with room, capped to the room, both fixed sides, shift removed on the next opening); the same browser check (the list opens above its button, inside the 1280 × 600 viewport, the page's scroll position unchanged, for click, ArrowDown and ArrowUp) |
| React | `ActionMenu` takes `placement` | `npm run types`; the React consumers of the browser check |

The new browser check was also run against the 0.1.3 menu source (restored afterwards): it failed on all three consumers with "the page did not scroll (311 → 636)", so it detects the defect it guards against.

Executed on Node.js 22.21.1, Chrome 153.0.8010.53, playwright-core 1.63.0, React 19.3.0 and 18.3.1, TypeScript 7.0.2.

| Check | Result |
| --- | --- |
| `npm test` | 81/81: 0.1.3's 79 plus the two tests above |
| `npm run types` | Passed |
| `npm run acceptance` | 67/67: plain DOM 25, React 19 27, React 18 15 (0.1.3's 64 plus the new check on each consumer) |

Final tarball: `dist-pack/beyond-ui-0.1.4.tgz`, integrity `sha512-X4DYdDXUbvojaNM3pNtv4UtMRl2bmbVhK0YclikZsXrqyiskY1Murjcq8KHFQ9SFCthipVPa84tDRzhja1KErg==`, 73 entries.

Consumers: the Beyond desktop vendors 0.1.4 (its `tools/beyond-ui-0.1.4.tgz`, identical to the packed tarball; its lockfile records the same integrity), recorded in its own evidence. No other consumer was re-vendored: Delegate and Branding stay on 0.1.3, Projects, Snapshots, Accounts and Workspace on 0.1.2 and CDN on 0.1.1. They keep the earlier placement until they re-vendor.

Not established: other browsers; a scroll container other than the document in this package's own fixtures (the desktop's browser acceptance covers its clipped application root); menus whose items change while open are not placed again until they reopen.

**Family reference synchronization — synchronized on 2026-09-26.** The change alters where an action menu opens and adds the `placement` option. When this record was written, Branding (the suite's `branding/` family reference) vendored 0.1.3, and its re-vendoring was outside that part of the assignment, so the outcome was blocked. The family reference 0.5.0 of the same working-journey assignment vendors this 0.1.4 tarball byte for byte, and its component catalog's `ActionMenu` entry (`branding/src/family/components/catalog.js`) lists `placement` and the focus that never scrolls; the suite's `branding/docs/reviews/2026-09-26/working-journey.md` records it. Token set 0.1.0; no proposal approval changes.

Committed on `feature/next` with this record on 2026-09-26, not pushed; the tarball is not published.
