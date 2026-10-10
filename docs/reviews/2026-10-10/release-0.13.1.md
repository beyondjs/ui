# Release 0.13.1 — 10 October 2026

The Desktop's adoption of 0.13.0 (its `docs/reviews/2026-10-09/ui-0.13.0-adoption.md`) found that a
notification entry outside a shared header lost its narrow panel: 0.13.0 kept `.bui-notify`'s
`position: static` below 481 px for every bell but scoped the panel's gutters to
`.bui-header:not(.bui-family)`, so the Desktop's bell, in its own bar, opened a panel from 32 px to the
viewport's right edge. It also measured the count's top half a pixel above the viewport in the
Desktop's 34 px bar.

| Part | 0.13.1 |
| --- | --- |
| A bell's narrow panel | Below 481 px every bell's panel spans the viewport less `--space-4` on each side, as in 0.12.0; the family bar's end still places its own (more specific) |
| Opening a matter | Opens its latest update and marks every other unread update of it read by identifier (`Actions.open(item, members)`), so the opened matter is no longer unread or counted; a failure to mark them leaves them unread and never holds the opening back. Delegate's adoption found that opening a two-update matter left it unread and counted (its `docs/reviews/2026-10-09/ui-0.13.0-adoption.md`) |
| The panel's page | `limit` matters are read from a page of `NotificationEntry.reach` (50) items instead of `limit × 3`: in Conduict a GitHub connection's 18 repeated notices filled the 18-item page, so the panel showed one matter while the count said 2 |
| The location's "/" | On the names' line box (`line-height: 1`), so it sits on their baseline: it was 0.57 px above them, measured live in Conduict |
| The count | 6 px above the glyph's box instead of 8, so it stays inside a low host bar; in the family bar it still ends inside the bell's target, clear of the avatar |

## Verification

| Check | Result |
| --- | --- |
| `npm test` | 496 passing: opening a matter marks its other updates read (and still opens when that marking fails), the 50-item page |
| `npm run acceptance` | 263 of 263 checks in Chrome 154, Firefox 155 and WebKit 26.6, each engine run whole on the packed 0.13.1. `ending.mjs` adds a bell moved into a 34 px bar of the page's own at 390 px: the count's top inside the bar and the panel one gutter from each side; it fails on 0.13.0 (the count at −0.125 px) and passes on 0.13.1. The inbox check counts a page's matters across "Today" and "Earlier": it read only the first list, so after midnight, when the fixture's ten-hour-old item falls under "Earlier", it failed in Chrome (a check of the check, not of the package) |
