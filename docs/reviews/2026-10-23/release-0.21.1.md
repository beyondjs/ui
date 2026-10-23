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

Conduict's working tree vendors this change's archive under its provisional number: `beyond-ui-0.20.5.tgz`, SHA-256 `966ea84cfd00f752b44f2aba8119b09da61dc5449c088ad5b5c3c4be51245feb`, byte-identical to the one packed in this worktree. Its All conversations uses `row`, `group` and `end`. No other consumer has vendored it. The 0.21.1 archive is packed after the rebase on 0.21.0; its digest is not recorded here.

## Executed checks

Executed locally on 2026-10-23 in Chrome 155, on the working tree before the rebase on 0.21.0:

- `npm test`: 754 pass, 0 fail. The new `tests/list-rules.test.mjs` adds 6 tests: a row's own options, groups and their labels, the end line, marked matches, the arrow keys with Down from the search, and `Recency` and `Matches` alone.
- `npm run types` passes.
- Installed acceptance, full run: 344 passed, 2 failed of 346 checks (DOM, React 19 and React 18). The run packed the working tree when it started, before the version changed; its archive is a snapshot of this work, not the vendored archive above. The two new checks pass:
  - "ListRow and DataTable rows share one geometry" (DOM and React 19);
  - "a grouped list: …" (DOM).

  Each runs in both themes at 1440 and 390 px.
- The two failures were "collection narrower than its table" (DOM and React 19). The collection body's new gutter hang crossed the container's edge by the hang itself. The check (`acceptance/checks/presentation.mjs`) now allows the body its declared hang and nothing more. The session that changed it reports 2/2 passing afterwards; that rerun's log is not part of this record.

Firefox and WebKit were not run. Nothing here is product acceptance: Conduict's adoption is recorded in its own repository.

## Family synchronization

The rules' formulation, the audit of every product's lists and each product's adoption pending belong to the Beyond Suite's `branding/docs/list-patterns.md` and its reviews. This package implements their shared part only.
