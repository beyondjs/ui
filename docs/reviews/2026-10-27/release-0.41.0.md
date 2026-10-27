# Local UI 0.41.0: a page's lead, a touch screen's notification rows, a title's room, a framed table and the inset measurer

Evidence baseline: UI `4062f48` (0.40.0, organizations told apart in the family bar) on `feature/next` plus this change, made on 2026-10-27 for the family round `tended`, which took the package's pendings the round `landed` left. The work began on 0.39.0 (`9eb5e57`) and was rebased onto 0.40.0 once it reached `feature/next`, so 0.41.0 follows 0.40.0.

## Why

- **`ui-insets-measurer-gaps`.** CDN's copy of the inset measurer (the round `landed`, cdn-v2 `0144fdb`) walked into `display: contents` and counted hidden overflow; ui's did neither, and the products copy ui's.
- **`ui-header-lead` (D191).** Beyond Projects wrote page leads in `PageHeader`'s facts line, which spans the whole column since 0.19.1, and capped `.bui-page-facts` itself as a stopgap.
- **`ui-preferences-note-link`.** "Change for all of Beyond" had no rule of the package's: a full underline under a product's base link rule, the browser's blue without one.
- **`ui-lanes-title-room`.** At 1280 px a crew's lane titles had 212 px and were cut while the trace and the kind kept their columns.
- **`ui-datatable-framed-insets`.** CDN's inset check found a `DataTable` in a card with its "fills" 8 px from the border and, at 390 px, its first words 33.5 px from the body's top; ui drew no table in a framed box.
- **`family-touch-notification-rows` (D192).** On a coarse pointer a notification row's 44 px targets grew it to about 21 px of inset against 8, and the insets check held the row for the record.

## What changed

- **The measurer** (`acceptance/support/insets.mjs`, commit `28f9c1e`, which products copy whole): it walks into `display: contents`, whose empty box no longer marks a line as stopping short; it counts `overflow: hidden` and `clip` as scrolling; it leaves out what is hidden on purpose (a caption a clip hides, a text a line clamp ends; ui's turn preview needed the latter); and a background whose every layer is a line 2 px thin or less is a divider, never a fill, so a table's cells are measured by their words. That last rule is what CDN's 8 px "fills" were: the cells' divider backgrounds read as shapes.
- **`PageHeader`'s `lead`** (D191; DOM option and setter, React prop, `types/page.d.ts`, `types/react.d.ts`): `p.bui-page-lead` under the facts line, body size, `--color-text-muted`, regular weight, in `prose.css`'s reading measure. A link inside takes the quiet underline. The facts line is unchanged and keeps the header's width.
- **"Change for all of Beyond"**: `.bui-preferences-note a` in `--color-link` and in the quiet-underline lists (`links.css`), full on hover.
- **`Lanes`' room** (`lanes/room.js`, `LaneRoom`): in the one-line form, while a title would be cut, the block folds its trace, then its kind (`data-fold`), keeping the first fold that shows every title whole, or the last. It measures on resize (`ResizeObserver`), on update and when the fonts arrive. A folded column takes no track; a folded kind is hidden from sight only, so it stays in the lane's name, and the name tooltip says it.
- **`DataTable`'s `framed`** (option, setter, React prop, `types/table.d.ts`, `types/react-table.d.ts`): at the top of a framed box with no tools above it, a wide table rises by its header row's room above the capitals (its scroller clips only empty padding) and a narrow one lifts its first row's padding and half-leading (its body then clips nothing). Its rows' fills hang into the box's padding as a menu's entries hang into theirs, 4 px from a 16 px box's border and 8 px from a 20 px card's. The last row keeps its padding: the bottom is free room.
- **A notification row on a coarse pointer** (D192, `notices.css`): Mark as read's and the earlier updates' targets are 44 px tall and rise from their line over the row's own padding and words, never below it. They stay inside the row and never cover the next row's targets or each other. A row shorter than a target and its end padding grows above its words.
- **Documentation**: the catalog (`PageHeader`, `DataTable`, `Lanes`, `PreferencesDialog`, the One inset table), architecture, validation, README and AGENTS.md.

## Executed checks

Through the machine's test queue, on 2026-10-27.

- **During the work** (archives packed from the worktree, run from snapshots of it, Chrome 156):
  - The measurer and every insets check: 20 of 20, then 39 of 43, then 34 of 36.
  - The failures and their fixes:
    - a cramped lanes block's expectation of one cut title (it cuts four; the assertion now asks for both folds before a cut);
    - the earlier updates' toggle, whose base rule's `margin-top` came after the coarse rule and grew the row by 22 px;
    - a two-line row 1.2 px shorter than its target, now grown above its words.
- **The candidate** (0.41.0 rebased onto 0.40.0, packed at `a203d79`, whose packed files the release commit keeps unchanged):
  - `npm test`: 1016 of 1016, React 18 included; `npm run types` compiles.
  - From the packed archive, the whole acceptance:
    - Chrome 156: 462 of 462;
    - Firefox 155: 462 of 462;
    - WebKit 26.6: 462 of 462.

    0.40.0's organization menu check is among them.
  - The archive: `beyond-ui-0.41.0.tgz` (npm's name `beyond-js-ui-0.41.0.tgz`), sha256 `5b742bbbf1c8d2546ea346a7bea42d28626f3abf069ec3993f51089484d025ea`, integrity `sha512-INUk7azrTnXIvD8qgKNumB3K4k5eEhxK1imizquYr1vnILHvFhNPvQZvp/0PDEiI6k6GlupHWCyNPrjhKq3cpA==`. Products vendor it when each one adopts it.

## Limits

- **D192's words.** The decision says a target "reaches into the row's own padding". As built, a target reaches over the row's own words above its line as well, since the padding alone (about 3 px) cannot make 44 px without growing the row and breaking its inset. A press on the right end of a notification's summary, over Mark as read's target, marks it read rather than opening it. The reference should word D192 as built, or the owner should choose otherwise.
- **`framed` is the product's statement.** The package cannot tell a framed box from a page. A product sets `framed` on a table that starts a box (CDN's backoffice cards). A table under a heading inside a box needs nothing.
- **A narrow framed table's fills.** Its first row's fill hangs into the box's top padding, as its sides do.
- **A cramped `Lanes` block.** In a block narrower than its titles need, both columns fold and titles are still cut. Each is whole in its tooltip. Nothing changes the head's and the live line's equal shares.
- Package evidence only. Nothing here is a product's adoption, screen-reader output or hosted behavior.

## Family reference synchronization

Synchronization is for the round's reference agent (reference 0.65.0, unregistered):

- **D191**: the reference's page headers move a lead sentence from the facts line to `lead`.
- **D192**: the notification rows on a touch screen.
- **`Lanes`**: the six-lane crew at 1280 px now folds its trace and kind before it cuts a title.
- **The Preferences link**: it takes the quiet underline.

No product vendors 0.41.0 yet.
