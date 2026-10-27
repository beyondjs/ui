# Local UI 0.39.0: the inbox's tools in the header, its filtered empty, and a product's own list (D162)

Evidence baseline: UI `53a1de3` (0.38.0) on `feature/next` plus this change, made on 2026-10-27 for the suite's AXIS request `accounts-projects-github-experience-20261026`, which left three of the list rules' gaps in the suite's pending `ui-list-rules-gaps` (10, 5 and the list part of 6).

## Why

- **Gap 10, the inbox (L8, L10).** Accounts' audit of 2026-10-27 found the shared inbox drawing its own toolbar (Unread/All, the product filter, Mark all as read) in its body under the page's H1, with no way for a product to put it in its header's action region as `Collection` and `DataTable` allow; and a product filter with nothing to show said "You are all caught up." or "No notifications yet.", as if the inbox held nothing, with no way to clear the filter.
- **Gap 5 (L7).** React exported `Recency` and `Matches` but not the arrow keys: a React product's own `ul.bui-rows` had to import `RowKeys` from the DOM entry inside an effect.
- **Gap 6 (L5).** The end line was drawn only by `Collection`'s list, so a complete list a product draws itself (Accounts' devices, histories) had no shared way to close.

## What changed

- **`NotificationInbox`'s `tools`** (DOM option `tools: 'external'`, React `tools="external"` with `toolsTarget`): the toolbar leaves the inbox's body; `inbox.tools.element` is the one toolbar, placed by the product (React through the same `useTools` as `Collection` and `DataTable`), hidden through an outage and removed with the inbox. Without it nothing moves.
- **The filtered empty**: with a product filter and nothing to show, "Nothing unread from {product}." / "No notifications from {product}." («Nada sin leer de {product}.», «No hay notificaciones de {product}.») with **Show all products** («Mostrar todos los productos»), which clears the filter, reports the state for the address and puts the focus on the filter. The product is named from `products`, else by its identifier. Label keys `cleared`, `none` and `widen`. With no product filter the inbox says what it always said.
- **`useRowKeys()`** (React): a callback ref for a product's own list that attaches `RowKeys` and releases it when the list leaves.
- **`EndLine`** (DOM and React): `p.bui-rows-end` with "Nothing more" or the product's words, and the keys only when asked; `Collection`'s list now draws its end line through it. `.bui-rows + .bui-rows-end` spans a product's own list past its reading measure, as under `Collection`.
- **Tables end with their pager's summary** (decided, `docs/list-tools.md`): a table's last page already says its whole range, so it draws no end line; tables mark no search words and have no row keys.
- **Types**: `types/parts.d.ts`, `types/react.d.ts` (the React inbox's props now pick the entry's shared ones), `types/react-shared.d.ts`.
- **Documentation**: the catalog, collection search and filters, architecture, validation, README and AGENTS.md.

## Executed checks

Through the machine's test queue, on the change over `53a1de3`:

- `npm run types` compiles, and `npm test` passes 995 of 995, React 18 included.
- From the packed archive: the whole acceptance in Chrome 155, 447 of 447, the new inbox check in the `dom` and `react19` consumers included.
- `node acceptance/run.mjs 'inbox|grouped list'` in Firefox 155 and in WebKit 26.6, 14 of 14 each: the inbox's checks (the new filtered empty among them) and `Collection`'s grouped list, whose end line is now drawn by `EndLine`.
- The archive: ARCHIVE

## Limits

- The external toolbar's placement in a page header is held in happy-dom and React; its layout beside a header's own actions is each product's acceptance.
- Gaps 1, 2, 3, 4, 7, 8 and 9 of the pending, and the list part of 6 for tables beyond the decision above, are not in this release.

Package evidence only. Nothing here is screen-reader output or hosted behavior.

## Family reference synchronization

No reference impact in this release by itself: no product vendors 0.39.0 yet, and the family reference draws its own inbox. The reference's inbox and Accounts' adoption follow in the suite's request that asked for it, which records its outcome.
