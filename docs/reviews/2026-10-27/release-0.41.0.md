# Local UI 0.41.0: a page's lead, a touch screen's notification rows, a title's room, a framed table and the inset measurer

Evidence baseline: UI `4062f48` (0.40.0, organizations told apart in the family bar) on `feature/next` plus this change. It was made on 2026-10-27 for the family round `tended`, which took the package's pendings the round `landed` left. The work began on 0.39.0 (`9eb5e57`) and was rebased onto 0.40.0 once that reached `feature/next`, so 0.41.0 follows 0.40.0. Its commits on this branch:

- `872f7cc`: the measurer;
- `223452b`: the features;
- `d85a5d1`: the release candidate;
- `b2e3352` and `4ff9559`: the D192 correction and the independent review's corrections;
- `0dd1fc8`: the delta review's corrections;
- `405b864` and the commit that carries this line: this record's last results, none of them packed.

## Why

- **`ui-insets-measurer-gaps`.** CDN's copy of the inset measurer (the round `landed`, cdn-v2 `0144fdb`) walked into `display: contents` and counted hidden overflow. ui's did neither, and the products copy ui's.
- **`ui-header-lead` (D191).** Beyond Projects wrote page leads in `PageHeader`'s facts line, which spans the whole column since 0.19.1, and capped `.bui-page-facts` itself as a stopgap.
- **`ui-preferences-note-link`.** "Change for all of Beyond" had no rule of the package's: a full underline under a product's base link rule, and the browser's blue without one.
- **`ui-lanes-title-room`.** At 1280 px a crew's lane titles had 212 px and were cut while the trace and the kind kept their columns.
- **`ui-datatable-framed-insets`.** CDN's inset check found a `DataTable` in a card whose "fills" stood 8 px from the border. At 390 px its first words stood 33.5 px from the body's top. ui drew no table in a framed box.
- **`family-touch-notification-rows` (D192).** On a coarse pointer a notification row's 44 px targets grew it to about 21 px of inset against 8, and the insets check held the row for the record.

## What changed

- **The measurer** (`acceptance/support/insets.mjs`, which products copy whole):
  - It walks into `display: contents`, whose empty box no longer marks a line as stopping short.
  - It counts `overflow: hidden` and `clip` as scrolling.
  - It leaves out what is hidden on purpose: a caption a clip hides, and a text a line clamp ends. ui's turn preview needed the latter.
  - A line a clamp or a clip hides decides no side: lines are clipped against the nearest holder, the box included, that hides or scrolls its overflow vertically.
  - A background whose every layer is a line 2 px thin or less, not repeating across it, is a divider, never a fill. A table's cells are now measured by their words. CDN's 8 px "fills" were these divider backgrounds read as shapes. A thin layer left to repeat is a fill.
- **`PageHeader`'s `lead`** (D191; DOM option, getter and setter, React prop, `types/page.d.ts`, `types/react.d.ts`):
  - `p.bui-page-lead` under the facts line: body size, `--color-text-muted`, regular weight, within `prose.css`'s reading measure. The facts line is unchanged and keeps the header's width.
  - An empty lead draws nothing, by one rule in the DOM and React: nothing, a boolean, empty words, or an empty list or fragment. A number is said.
- **Links among the package's words**: `.bui-preferences-note a` ("Change for all of Beyond"), and a link in a lead, a `bui-reading` paragraph, a callout's text or an `Unavailable`'s reason, take `--color-link` (visited or not) and the quiet underline, full on hover (`links.css`). The colour of links a product passes in (a lead, `bui-reading`, a callout, a reason) weighs as a base `a` rule (`:where`), so a product's own link class wins; the dialog's own link holds over a base rule.
- **`Lanes`' room** (`lanes/room.js`, `LaneRoom`):
  - In the one-line form, while a title would be cut, the block folds its trace, then its kind (`data-fold`). It keeps the first fold that shows every title whole, or the last one.
  - It measures again only when the block's drawn width (fractions included), its columns or its lanes' depth, titles, kinds and facts change, and once the fonts arrive.
  - A folded column takes no track. A folded kind is hidden from sight only: it stays in the lane's name, and the name tooltip says it.
- **`DataTable`'s `framed`** (option, setter, React prop, `types/table.d.ts`, `types/react-table.d.ts`): at the top of a framed box with no tools above it, the table's first capitals stand at the box's inset.
  - A wide table rises by its header row's room above the capitals. Its scroller clips only empty padding.
  - A narrow one lifts its first row's padding and half-leading, and its body then clips nothing.
  - A grouped narrow one does the same for its first group's heading, in the heading's own size.
  - Its rows' fills hang into the box's padding as a menu's entries hang into theirs: 4 px from a 16 px box's border and 8 px from a 20 px card's.
  - The last row keeps its padding, so the bottom is free room.
- **A narrow `DataTable`'s hidden header** (`table/head.js`, `DataHead`, D187): under 36rem its sort buttons leave the Tab order (`tabindex="-1"`) and stay in the accessibility tree. This is an older defect the review found. The narrow form offers no sort of its own.
- **A notification row on a coarse pointer** (D192, `notices.css`, as the coordinator directed on review):
  - Mark as read's and the earlier updates' 44 px targets take their own line and grow below their words. They stay in the row's padding box and off its words, so a press on the row's words always opens the matter (D79).
  - A row whose last line is a control's gives that target its end padding, so the row grows only by the rest.
  - The row keeps its 8 px inset at its top and sides. Below the last control's words stands the target's room: 31 px in Chrome 156, 30.8 px in Firefox 155 and 30.9 px in WebKit 26.6.
- **Documentation**: the catalog (`PageHeader`, `DataTable`, `Lanes`, `PreferencesDialog` and the One inset table), architecture, validation, README and AGENTS.md.

## The independent review (2026-10-27) and its corrections

All eight corrections are in `b2e3352`, with tests:

1. A thin background layer that repeats is a fill (`measure.css`'s `#repeated`, `measuring.mjs`).
2. A clamp's hidden lines decide no side (`#clamped` measured as `#fits` at its top and bottom).
3. A grouped, framed, narrow table's first group heading (the insets fixture's `#table-grouped`).
4. The colour of links among the package's words (`leading.mjs`: the lead's link with no base rule).
5. One rule for an empty lead (`lead.test.mjs`, the DOM and React).
6. `lead`'s getter.
7. `LaneRoom` measures only on a change, from the drawn width (`lanes-room.test.mjs`).
8. This record cites the branch's own commits.

`touching.mjs` now sweeps each line of a row's words with `elementFromPoint` and checks that no press there reaches a target. The earlier `.bui-notice` `min-height`, which mixed the row's `lh`/`cap` with the label's, is gone with the change of geometry.

## The delta review (2026-10-27) and its corrections

The delta review of `4ff9559` found two problems. Both are corrected in `0dd1fc8`, with tests:

1. **The lanes regression.** `LaneRoom`'s key left out the facts column, each lane's facts and its depth. Token counts arriving after a lane started left the trace folded with every title cut at 51 of 141 widths. The key now holds them, and `lanes-room.test.mjs` changes only the facts, then only the depth.
2. **The link colour.** The colour of links among the package's words outweighed a product's link class passed in. It now weighs as a base rule; `lead.test.mjs` and `leading.mjs` cover it with a product's class.

## Executed checks

Through the machine's test queue, on 2026-10-27.

- **During the work** (archives packed from the worktree, run from snapshots of it, Chrome 156): the targeted runs found, and the work fixed:
  - a cramped lanes block that cuts four titles;
  - the toggle's base `margin-top` overriding its coarse rule;
  - a two-line row too short for the first geometry;
  - rows compared across scroll positions in `touching.mjs`;
  - a grouped narrow table's heading 1.1 px high.
- **The candidate before the review** (`a203d79`): `npm test` 1016 of 1016, `npm run types`, and the whole acceptance 462 of 462 in each of Chrome 156, Firefox 155 and WebKit 26.6.
- **The release candidate after the review** (0.41.0 at `b2e3352`; `4ff9559` adds only this record's results and the sorting check's correction below, neither of them packed):
  - `npm test`: 1019 of 1019, React 18 included; `npm run types` compiles.
  - From the packed archive, the whole acceptance:
    - Chrome 156: 464 of 464;
    - Firefox 155: 464 of 464;
    - WebKit 26.6: 462 of 464.
  - WebKit's two failures were the new `sorting.mjs`: WebKit's Tab passes over buttons, as a Mac does without full keyboard access. The check now reads the buttons' Tab order there, and Tabs into the header from right before the table's body, after its search. It ran again from the same archive: 2 of 2 in each of Chrome, Firefox and WebKit.
  - The coarse-pointer insets of a notification row: 7.8 to 8 px at its top, 8 px at its sides, and the target's room below of 31 px (Chrome), 30.8 px (Firefox) and 30.9 px (WebKit).
  - That archive (sha256 `71abd3be…42ad`) is superseded by the delta review's correction below.
- **After the delta review** (0.41.0 at `0dd1fc8`, the archive products vendor):
  - `npm test`: 1021 of 1021; `npm run types` compiles.
  - From the packed archive, the affected checks: the lanes, the lead and its links, preferences, every insets check, the measurer, focus, prose, callouts and `Unavailable`. 152 of 152 in each of Chrome 156, Firefox 155 and WebKit 26.6.
  - From the same archive, the whole acceptance, each engine its own bounded queue run: Chrome 156 464 of 464, Firefox 155 464 of 464, WebKit 26.6 464 of 464.
  - The archive: `beyond-js-ui-0.41.0.tgz`, sha256 `a24405f1efd3907e8e96a606d6fc3d813dd7347b0ad163efe1b35b7217e1cf98`, integrity `sha512-SYHnx8f/7CUUwy+qdiZvyupVjWWYx9q10qQChKTJO6QhniBfEsm9RxibnMqK6M75ttIW/ITNEBLadvZ2Bcc0Wg==`. Products re-vendor it in place of the earlier 0.41.0 archive.

## Limits

- **`framed` is the product's statement.** The package cannot tell a framed box from a page. A product sets `framed` on a table that starts a box, as CDN's backoffice cards do. A table under a heading inside a box needs nothing.
- **A narrow framed table's fill.** Its first row's fill hangs into the box's top padding, as its sides do.
- **A cramped `Lanes` block.** In a block narrower than its titles need, both columns fold and titles are still cut. Each is whole in its tooltip. The head's and the live line's equal shares do not change.
- **The narrow table's sort.** It has no keyboard or pointer way while its header is hidden, as before; a screen reader still reaches the header's buttons.
- **Package evidence only.** Nothing here is a product's adoption, screen-reader output or hosted behavior.

## Family reference synchronization

Synchronization is for the round's reference agent (reference 0.65.0, unregistered). No product vendors 0.41.0 yet.

- **D191**: a lead sentence moves from the facts line to `lead`.
- **D192 as built**: targets in the row's padding box and off its words, and the bottom room on touch.
- **`Lanes`**: the six-lane crew at 1280 px folds its trace and kind before it cuts a title.
- **Links**: links among the package's words take the text's colour and the quiet underline.
- **`DataTable`**: a narrow table's header is out of the Tab order.
