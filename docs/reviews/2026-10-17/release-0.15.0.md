# Release 0.15.0 — 17 October 2026

The shared foundations the family audit of 2026-10-17 found missing (Beyond Suite's
`docs/reviews/2026-10-17/conduict-audit/design.md` and `family-audit/README.md`, family cause 5:
"`@beyond-js/ui` gives building blocks, not patterns"), and the visual rules of decision C2
(`family-audit/decisions.md`, decided under the owner's delegation; the owner may override it). Token
set 0.6.0. Implemented and verified locally (see Validation below); not published, not adopted by any
product yet: adoption is the next wave, one assignment per product.

| Finding | 0.15.0 |
| --- | --- |
| DQ-01, OWN-21: menus with no positioning primitive | `Floating` (`src/dom/core/floating.js`, public): the top layer through the popover API (fixed above the page elsewhere), an element or a virtual anchor (a caret), flip, shift and size inside the visual viewport less the sticky family bar and `[data-bui-edge]` edges, placed again on scroll, resize, the visual viewport and size changes, an anchor scrolled away hiding it, and a hidden anchor refused with a `bui-refused` event (`detail: { reason: 'hidden', retry }`). `ActionMenu`, `ChoiceMenu` and `ChoiceChip`, the composer's suggestions (at the caret), in-page `Disclosure` panels, `Tooltip`, `Hint` and the cut-name tooltip use it; `Placement` is gone. A composer's Options answers a refusal by unfolding and opening the chip. |
| DQ-02: "Choose · Choose · Choose" | A `ChoiceChip` with nothing chosen says its slot's name ("Machine") with its `glyph`, unless the product gives a placeholder |
| DQ-04, C2: status by shape | `Status` (dot or badge; a closed set of states, each a tone with its shape: filled circle, open ring, diamond, square, hollow circle, dashed circle; the family's words in English and Spanish); `status()` and React `Status` draw the same shapes |
| DQ-12, DQ-09, DQ-05: lists | `ListRow` (dense row, the whole row opening its object, quiet actions, an overflow menu, a picker's check, compact on a narrow row); `Collection`'s `presentation: 'list'`, no range or pager on one page, a compact search; `DataTable` (search, sort, groups, pages, state for the address through `onchange`, no data told from no match, controls hidden when empty, two short lines a row when narrow) |
| DQ-17: empty states and first runs | `Checklist` (ordered steps with progress, done steps folded) and `EmptyState` (`empty`, `match` with "Clear the filter", `context`; one action; a first run's checklist) |
| DQ-13: the approval card | `CommandCard` (attention edge on a raised surface, the command whole in mono with Show all, scope, Enter and Escape while focused, one answer at a time, a failed answer said in place, the outcome stated) |
| DQ-16: skeletons | `skeleton({ rows, kind: 'lines' \| 'list' \| 'table' })`, React `Skeleton` `rows` and `kind`; guidance in the component catalog |
| Copyable identifiers (D104, DQ-07) | `CopyValue` (mono, cut at its end or middle and shown whole, Copy that says Copied) |
| PKG-14, DQ-19: the bar | `FamilyBar` `descriptor: { context: 'none' }` (state `none`: no placeholder), `projects: false` (no project crumb or chooser, for Accounts), loading bounded by `bound` (15 s by default, D40) |
| SNP-16 | `productNames.packages` is "Packages" |
| X-15, PKG-19: tabs | `Tabs` and `ProductNav` say which end holds more (`more`, `data-more`), with a fade and a chevron that scrolls the row (`ScrollEdges`) |
| PKG-19, D99: facts | A long value stays in the value column; only a facts container under 30rem puts it under its label |
| D43, PKG-16: failures | `Unavailable` and a danger `callout()` take `details` (`{ request, time, text }`) and draw "Technical details"; `Unavailable`'s `kind: 'outage'` draws a globe, never a lock |
| MCH-10, DQ-22: the sidebar | A section entry's label keeps its words beside a long `meta`, which is cut at its end and shown whole in a tooltip |
| X-15, DQ-19: key hints on touch | `Hint` leaves out a shortcut when shown by a touch press; `.bui-keys` / `[data-bui-keys]` are hidden where there is no keyboard (`hover: none` and `pointer: coarse`) |
| X-07: notifications by matter | The adapter's optional `readGroup({ product, group })` and `unreadGroup({ product, group })` reach a whole matter when it is opened or marked; the inbox asks for a page of matters (`by: 'matter'`, `limit` counts matters) and reads on (at most `Feed.pages`) from a relay that ignores it; a matter says all its updates (`updates: { count, unread, more? }`, "100+" past what was counted) and a resolved matter says when (`resolved`) |
| C2: visual rules (token set 0.6.0) | Inter 400/500/600 shipped in `fonts/` (with `OFL-Inter.txt`), `--font-sans` Inter and `--font-brand` Rubik for the lockup's name, `--weight-semibold`; `--color-link` is the text's color; standalone links underline on hover and links in sentences keep a quiet underline (WCAG 1.4.1); `.bui-mono`; `--color-surface-raised`, `--elevation-raised`, `.bui-raised` and `Section`'s `raised`; neutral disabled primaries (`--color-disabled`, `--color-on-disabled`); the light bar and sidebar on the page's surface (`--color-sidebar`, `--color-sidebar-hover`), tooltips' own roles (`--color-tooltip`, `--color-on-tooltip`), the bar's hover per theme; off-white text on dark (`mist-100`, DQ-10); the page title at 600; the avatar neutral; the sidebar's current item on the selection's surface |
| C2, DQ-14: a centred thread | `Page`'s `lane: 'center'` in the thread template |

Not built in this release, and why: a shared `CommandPalette` (DQ-21) and `ChoiceCards` (DQ-15) were not in
this assignment; the composer's "a missing precondition replaces Send" (DQ-03) and the merged phone bar
(DQ-19's two rows) change the composer's and the bar's layout contracts and wait for the products'
adoption round; the development warning for more than one primary per view (DQ-09) is left to the family
acceptance's checks.

## Migration notes for 0.14.x consumers

Additive unless listed here. Every behavior change below is visible; a product re-vendors deliberately.

- **Fonts and text.** `--font-sans` is Inter. A product that imports `@beyond-js/ui/fonts.css` gets it with no
  change; one that loads Rubik itself should load `fonts.css` instead. Body text set with `--weight-light`
  draws Inter 400 (no 300 is shipped); write `--weight-regular`. Use `--font-brand` only for a wordmark's
  neighbor. Identifiers, paths and hashes take `.bui-mono` (or `data-mono`).
- **Colors.** `--color-link` is the text's color. A product that drew links, titles or actions in
  `--color-link` to make them coral now gets the text's color: keep coral only for the primary action
  (`--color-action`), the selection (`--color-accent`, `--color-surface-selected`) and focus. A product's own
  links in sentences keep an underline. In the light theme the family bar is white with navy words
  (`--color-family-*` roles): a product's own header styles that assumed a navy bar (white text, white hover)
  must use the family roles and `--overlay-lift`. Tooltips use `--color-tooltip`. A disabled primary is grey.
  Dark text is `#e6e9ef`.
- **Placement.** A menu, a choice list, a suggestion list, an in-page disclosure panel and a tooltip are
  `position: fixed` in the top layer while open, placed inline. A product's CSS that positioned them
  (`top`, `left`, `bottom`, `translate` on `.bui-menu`, `.bui-choice-list`, `.bui-composer-suggest` or a
  `.bui-disclosure-panel` outside a header) no longer applies and should be removed. `placement: 'above'` and
  `'below'` are preferences that flip when that side has no room and the other has more. `open()` of
  `ActionMenu`, `ChoiceMenu`, `ChoiceChip` and `Disclosure` returns whether it opened. Panels inside a
  `.bui-header` (the family bar's menus, a bell in a host's own bar) keep the header's geometry.
- **Lists.** `Collection` shows no range and no pager when everything fits on one page, and its search label
  is visually hidden (the placeholder names what it searches). A product test that read "1–3 of 3" or the
  visible label changes.
- **Family bar.** `state` may be `none` (types: `'loading' | 'unavailable' | 'none' | 'ready'`); a null
  descriptor becomes `unavailable` after `bound` (15 s); pass `bound: 0` to keep the earlier behavior.
- **Facts.** A long value (`data-long`) stays beside its label unless the facts container is under 30rem.
- **Sidebar.** The panel and the drawer use `--color-sidebar`; the current item sits on
  `--color-surface-selected`.
- **Notifications.** The inbox sends `by: 'matter'` in `list()`; a relay may ignore it. A relay that forwards it
  should forward `by=matter` to Beyond Projects once Projects implements it.
- **Status.** `.bui-status-dot` is 9 px and takes a shape by tone (`warning` a diamond, `danger` a square,
  `progress` an open ring).

## Adoption notes by product (the next wave)

- **Conduict.** Remove `placement: 'above'` from the model chip (`frontend/src/app/compose/settings.js`) or keep
  it (it now flips); `/model` calls `chip.open()` and Options unfolds by itself. Drop the CSS that hid tray chip
  labels (`frontend/src/styles/compose.css`) and pass each slot's `glyph`. Map machine, conversation and
  repository states through `Status` with D105's words. Draw conversations and machines with `ListRow` (or
  `Collection`'s `presentation: 'list'`) and approvals with `CommandCard` (say the waiting state once and
  `focus()` it). Replace the empty project Overview with `EmptyState` + `Checklist`. Use `Page`'s
  `lane: 'center'` for a conversation and `Section`'s `raised` for the inspector's panels. Put "/ for commands"
  and "⌘K to search" in `.bui-keys`. Give failures `details` (request id, time) and outages `kind: 'outage'`.
  Replace `.conduict-fold` with `Disclosure`. Give the inbox relay `readGroup` and forward `by=matter`. Remove
  identifiers from sentences into `CopyValue` (D104).
- **Projects.** Its notification routes by matter (built on its branch `audit/2026-10-17-projects-notices`,
  the contract the package follows): a matter is `(product, group)`, an item without a group its own matter;
  `POST /v1/notifications/read` and `/unread` with `{ product, group }` (exclusive with the other body forms);
  `GET /v1/notifications?by=matter`, `limit` counting matters, one item per matter (its newest visible update)
  with `updates: { count, unread, more? }`; an update may carry `resolved` (the package says "Resolved on
  {date}" and does not count it unread). The package detects a page of matters by `updates` on its items. Draw the hosted repository picker with `ListRow`
  rows in `select` mode (DQ-05) and quiet row actions (DQ-09; "Allow writing" out of the list's primary
  style). Give its own inbox adapter `readGroup`.
- **Accounts.** Pass `projects: false` to `FamilyBar`. Draw members with `ListRow` (Remove in its menu, the
  account identifier as `CopyValue` in the menu or not at all, DQ-07, DQ-20). A disabled Save is now grey.
- **Packages (packages/ui).** Pass `descriptor: { context: 'none' }` while no connection is chosen (PKG-14).
  Drop any local "packages" name (`productNames` has it). Use `kind: 'outage'` with `details` for an
  unreachable server (PKG-16). Tabs and long facts are fixed in the package (PKG-19).
- **Snapshots.** Remove the local product-name patch (`frontend/src/pages/facts.tsx`) and use `productNames`;
  give the notification relay `readGroup`; use `Status`, `CopyValue` (content hashes) and `DataTable` for
  snapshot lists.
- **Delegate.** Give the notification relay `readGroup` and `by=matter`; adopt `Status`, `ListRow`/`DataTable`
  for requests and `EmptyState` for "no agent connected" with its way on.
- **CDN (administration).** `CopyValue` with `href` for a release's testing address (E7's Visit and Copy URL),
  `DataTable` for releases and outputs, `details` on every failure.
- **Desktop.** Check `desktop/src/styles/bar.css`: the light family bar is white; its own bar must read the
  family roles. Re-vendor for the menus' top layer.
- **Family reference (branding).** Re-export token set 0.6.0, update the manual (Inter, links, raised
  surfaces, status shapes, disabled), the components catalog (`branding/src/family/components/`) for the new
  patterns, and the decision register's amendments of D08, D09, D10, D12 and D52 by C2.

## Validation

- `npm test` (Node's runner over happy-dom): 616 tests pass, among them the new `floating`, `status`, `list`,
  `checklist`, `command`, `table`, `audit-family`, `audit-fixes` and `audit-notices` files and the updated
  `tokens`, `fonts`, `foundations`, `controls`, `notifications` and `collection` files. `npm run types` passes
  with the new fixtures (`floating`, `patterns`, `table`, `audit`, `tokens`).
- `npm run acceptance` (packed tarball, three consumers) adds `acceptance/checks/auditing.mjs` on a new
  `audit.html` fixture page: every menu visible, inside the viewport and not under the bar, in the top layer;
  a menu in a box that scrolls not clipped; the "/" list at the caret's line; a folded chip opening through
  Options; Status shapes distinct in both themes; ListRow and DataTable rows short at 390 px; tabs saying they
  hold more; a sidebar label kept on one line beside a long count; a CommandCard answering Enter once. The
  results of the runs, by engine, are in the addendum below.
