# Local UI 0.21.1 verification

UI 0.21.1 implements the part of the family's list rules (D162) that the shared package can carry. The owner gave the direction on 2026-10-23: Conduict's All conversations is the family's list, and its rules apply to every list and every collection's tools. The Beyond Suite's `branding/docs/list-patterns.md` states rules L1–L10 in its section "The family's list rules (D162)". This release is built on 0.21.0; this record covers only what 0.21.1 adds. The changes were developed and tested under the provisional number 0.20.5, which the source comments and type declarations still name.

## What changes

- **`Collection`'s list presentation** (`src/dom/collection/collection.js`, `rows.js`, `labels.js`):
  - `row(row)` gives a row's own `ListRow` options over the columns' (L2).
  - `group(row)` returns `{ key, label }` and puts consecutive rows under their label (L4). Each group is a `ul.bui-rows` named by its label, inside `.bui-rows-groups`.
  - `end` draws one end line on the last page (L5): `true` (the default) says "Nothing more" ("No hay más"); a text, a node or a function of `{ count }` gives the product's words; `false` draws none. A pointer screen adds the keys in `.bui-keys`.
  - A name given as text marks the search's words (L8). Down from the search reaches the first row (L7).
- **New exports.** DOM: `RowKeys` (`src/dom/list/keys.js`), `Matches` (`src/dom/list/matches.js`) and `Recency` (`src/dom/collection/recency.js`, with English and Spanish labels). React: `Recency` and `Matches`, and `Collection`'s props `row`, `group` and `end`.
- **Styles.** `src/styles/list-rules.css` is new and covers:
  - a row's lead on its name's line;
  - the overflow menu shown on hover, focus and while open where there is a fine pointer, and always on touch;
  - a row whose end holds only its menu keeping it beside its name;
  - group labels, the end line and `.bui-match`.

  `list.css` lets a narrow row's muted line wrap (L10). `collection.css` and `table.css` (commit `4ac58ea`) apply the rows' geometry to `Collection` and `DataTable` bodies: they hang into the gutter like rows, dividers are `--color-border-strong` on the content edge with no line above the first row, and row hover is `--overlay-lift` (L1, D159).

## What every consumer sees on vendoring

These are behavior changes, not opt-in options:

- Every `ListRow` with a menu hides it on a pointer screen until the row is hovered or focused, or the menu is open. Every row's lead moves to its name's line.
- Every `Collection` and `DataTable` body hangs into the gutter. Its dividers change color and position, and the line above the first row is gone.
- Every `Collection` with `presentation: 'list'` ends its last page with "Nothing more" unless the product passes `end: false` or its own words.

A consumer that vendors 0.21.1 checks its lists and tables in the browser before adopting it.

## Archive

`dist-pack/beyond-ui-0.21.1.tgz`, packed after the rebase on 0.21.0 and the review's fixes: SHA-256 `613bc5c98311c1ea1ad7dd35c47f327a9fe27368bf4b124b0595bcd33504dc36`, integrity `sha512-a/hjSoxtKs0/ddQn9S4x1qSteKf8pqKJN6RGed97WP+r2LAX6G4itOByMecuPhcsr3HJDtO83DcFSoOJeCOpYg==`. Conduict vendors it, and its All conversations uses `row`, `group` and `end`. No other consumer has vendored it. Before the rebase, the same changes were packed under a provisional 0.20.5 for Conduict's working tree only; that archive is not released.

## Executed checks

Executed locally on 2026-10-23 in Chrome 155. The full run used the working tree before the rebase on 0.21.0. After the rebase, on 0.21.1: `npm test` passes 759 of 759 (0.21.0's tests included), `npm run types` passes, and the three list checks pass ("a grouped list" 1/1, "share one geometry" 2/2, "collection narrower than its table" 2/2). Before the rebase:

- `npm test`: 754 pass, 0 fail. The new `tests/list-rules.test.mjs` adds 6 tests: a row's own options, groups and their labels, the end line, marked matches, the arrow keys with Down from the search, and `Recency` and `Matches` alone.
- `npm run types` passes.
- Installed acceptance, full run: 344 passed, 2 failed of 346 checks (DOM, React 19 and React 18). The run packed the working tree when it started, before the version changed; its archive is a snapshot of this work, not the vendored archive above. The two new checks pass:
  - "ListRow and DataTable rows share one geometry" (DOM and React 19);
  - "a grouped list: …" (DOM).

  Each runs in both themes at 1440 and 390 px.
- The two failures were "collection narrower than its table" (DOM and React 19). The collection body's new gutter hang crossed the container's edge by the hang itself. The check (`acceptance/checks/presentation.mjs`) now allows the body its declared hang and nothing more. It passes 2/2 on 0.21.1.

Firefox and WebKit were not run. Nothing here is product acceptance: Conduict's adoption is recorded in its own repository.

## Family synchronization

The rules' formulation, the audit of every product's lists and each product's adoption pending belong to the Beyond Suite's `branding/docs/list-patterns.md` and its reviews. This package implements their shared part only.

## Independent review and its fixes

An independent source review of this release and of Conduict's adoption found eleven issues, all fixed before release:
- **Labels:** a product that passes its own `labels` to `Collection` must add `end` and `keys`, or those words fall back to English (`Labels` reads the English defaults). Conduict adds them, and Your work passes `end: false`.
- **Collection table on a phone:** its stacked rows keep their hang into both gutters. A new check, "a collection's table whose rows stack on a phone…", passes 2/2.
- **Lead:** only a row with a quiet line puts its lead on the name's line; a row of one line keeps it centered.
- **Focus:** a row's name that holds the focus keeps it when the list is drawn again.
- **Down from the search:** it waits while an input method composes and while an answer that replaces the rows is on its way.
- **End line:** a list whose rows open nothing shows no keys.
- **Narrow DataTable:** a group's heading has one line above it.
- **Hidden columns:** the last shown cell keeps the right inset when a column of lower priority is hidden.
- **React:** `end` takes a function of the count and reads the latest props.

`tests/list-rules.test.mjs` adds two tests for the focus, the keys and the search's Down.
