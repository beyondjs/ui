# Collection search and filters

`Collection` and `DataTable` share collection tools for finding records. Products provide actual filters, matching rules, navigation and actions. The toolbar never creates data or invents filter choices.

## Choose placement

Both DOM classes and React adapters accept `tools`:

| Value | Behavior |
| --- | --- |
| `compact` (default) | Search opens from its named control; Filters groups the supported choices. Applied query and filter values remain visible. |
| `expanded` | Search stays expanded within the collection; Filters keeps its grouped choices. |
| `external` | The collection owns the toolbar and state, while its caller supplies the placement. |

The compact search's button and its field keep one accessible name (decided in 0.35.0): the button is a disclosure (`aria-expanded`, `aria-controls`) that opens the field it names, so both name one thing. A browser test opens it with `getByRole('button', { name: 'Search requests' })`, then reaches the field with `getByRole('searchbox', { name: 'Search requests' })`; `getByLabel('Search requests')` matches both and fails a strict locator.

In DOM code, place `collection.tools.element` in the page's action region when using `tools: 'external'`. Use the same element; do not construct a second toolbar for the same collection. Destroying the collection also destroys its toolbar. `collection.tools.focus()` opens and focuses search, or focuses the first control when search is disabled.

Keep collection tools secondary. A page's creation action remains primary and other product actions remain secondary. At narrow widths, let the shared toolbar wrap while keeping the applied query and filter values readable. The toolbar stays reachable through loading and empty results, including an initial empty collection, so applied restrictions remain understandable. `search: false` removes search; without filter definitions either, there are no controls to show.

## React outlet

React `Collection` and `DataTable` accept `toolsTarget`, an empty `HTMLElement` dedicated to that instance. Set `tools="external"` explicitly. A callback ref can supply an outlet rendered elsewhere in the page:

```jsx
function Machines({ rows, columns, state, onChange }) {
  const [outlet, setOutlet] = React.useState(null);
  return <>
    <div ref={setOutlet} />
    <DataTable label="Machines" rows={rows} columns={columns}
      tools="external" toolsTarget={outlet}
      state={state} onChange={onChange} />
  </>;
}
```

The adapter places the collection's existing toolbar in the outlet. Changing the outlet moves that element without recreating the collection. Removing the target detaches the toolbar; unmounting releases it. Keep the outlet empty of React children, give each collection its own outlet, and do not also move the toolbar manually. The page may compose the outlet beside its existing actions with the shared layout components.

## State and filtering

`Collection` sends `{ query, filters, page, limit, signal }` to its source. The source applies its existing authorization and filtering. Its `onstate` callback (`onState` in React) reports the current query, filter values and page for the address.

`DataTable` accepts filter definitions with `name`, `label`, optional `all`, `options` and `match(row, value)`. The table applies matching only for selected values. Its `onchange` callback (`onChange` in React) includes `filters` when filter definitions or input filter state exist. Tables without either preserve their existing query/sort/direction/page state shape. React matching callbacks read the latest props and a changed predicate reevaluates unchanged rows without remounting the toolbar. Products supply definitions for every supported filter key: input state without definitions is retained for compatibility but does not create a visible filter or matching rule.

Restore `state` from the address to reproduce Back, Forward and reload. Restoration is silent: it does not report another user change. The same echoed state must not reset focus. Query typing is debounced; filters and clearing apply immediately. Closing search flushes its pending query rather than silently losing input. **Clear filters** preserves the query; **Clear search** preserves filters. An unavailable value of a defined filter remains visible as unavailable rather than silently dropping the restriction.

## Independent tools

DOM `Collection.Tools` constructs the same toolbar for a product that owns its own collection renderer. It accepts `label`, `search`, existing collection `filters`, `state: { query, filters }`, `onchange`, `labels`, `compact` and `delay`. It exposes `element`, a silent `state` getter/setter, `focus()` and `destroy()`. The caller owns loading, pagination and the address; tools report only query and filters.

`Collection.Tools.labels.en` and `.es` contain the toolbar copy. Collection/table label overrides also accept these keys: `search`, `placeholder`, `tools`, `filters`, `filtered`, `remove`, `reset`, `erase`, `query`, `all` and `unknown`. DataTable's `clearFilters` labels its no-match reset of search and filters together. Preserve their interpolation tokens. Filters uses the catalog's `filter` glyph with its visible label; it does not extend the closed list of unlabeled controls. A product that has no search or filters supplies neither control; an icon must never imply an unsupported function.

## List rules (0.21.1)

The family's list rules (D162) add three behaviors to a collection's tools when `Collection` uses `presentation: 'list'`:

- Down from the search moves the focus to the first row's name, wherever the toolbar is placed (L7). Up, Down, Home and End then move between the rows' names.
- The search's words are marked in names the columns or `row` give as text (`Matches`, L8). A name given as a node is left as given.
- The last page ends with one end line (`end`, L5). A filtered or searched list ends with it too; a page with more after it has none.

Placement follows the rule L8: the page header's action region, before the page's own actions, when the list is the page; a section's heading line when the list is one of several or a tab. The Beyond Suite's `branding/docs/list-patterns.md` states every rule. A period is a filter kind of its own since 0.44.0 (below).

## A product's own list and the inbox (0.39.0)

- **A list a product draws itself** in `ul.bui-rows` takes the same keys and end line as `Collection`'s list. In the DOM, `new RowKeys(list)` and, after the list once it is complete, `new EndLine({ text, keys, labels }).element`. In React, `const keys = useRowKeys()` as the list's `ref` (the keys are released when the list leaves) and `<EndLine text keys labels />` after it. Give `keys` only when the rows open and the focus can move (two rows or more), as `Collection` does. `EndLine.labels.en` / `.es` hold "Nothing more" and the keys' words; a history says its own end ("Nothing older.").
- **Tables end with their pager's summary.** A `DataTable` or `Collection`'s table on its last page already says the whole range ("41–45 of 45"), so it draws no end line (decided in 0.39.0, L5). Tables mark no search words and have no row keys: a person compares their columns, and the rows' names stay links reached with Tab.
- **A table's row menus** (0.44.0, L6): `DataTable`'s `menu(row)` draws each row's actions in a column of their own, revealed as a list row's menu is (where the pointer rests or the focus is, always on touch) and beside the name on a narrow table. A product's always-visible menu column or destructive button columns move into it; a column of the product's own marked `menu: true` (0.43.0) is drawn as the same column, revealed alike.
- **The notification inbox** takes `tools: 'external'` (React `tools="external"` and `toolsTarget`) like `Collection`: its Unread/All toggle, product filter and Mark all as read leave its body and `inbox.tools.element` is the one toolbar the page places in its header's action region (L8). An outage hides that toolbar until the relay answers. A product filter with nothing to show says so for that product ("Nothing unread from CDN.", "No notifications from CDN.") with **Show all products**, which clears the filter and puts the focus on it (L10).

## A period filter (0.44.0)

A filter of `kind: 'period'` chooses a period instead of listing options: `{ name, label, kind: 'period', all, days, months, now }`. People choose a period, never type a date (D56). It is kept in the filter state as text, like any filter's value, so the address reproduces it, its chip says it ("Period: September 2026") and **Clear filters** removes it.

| Value | Period | Offered |
| --- | --- | --- |
| `P30D` | the last 30 days, today included ("Last 30 days"; `P1D` is "Today") | `days`, `[7, 30]` by default |
| `2026-10` | a calendar month ("October 2026", «octubre de 2026») | `months`, 3 by default: this month and the two before |
| `2026-09-01/2026-09-15` | a span of days, both included ("Sep 1, 2026 – Sep 15, 2026") | never; a product's link writes it in the address |

Periods are UTC days, as the family's usage and cost records count them. A well-formed value the address holds outside the offered ones (an older month, a span) is offered with its own name; a malformed one stays visible as "Unavailable choice". `all` names no period, "Any time" («Cualquier fecha») by default; a report that always covers a period treats no value as its default period and names it there (`all: 'Last 30 days'` with `days: [7]`), so its default is never offered twice. `now` is the clock the offered periods count from.

The source reads the range with `Period.range(value, { now })` (also `Collection.Tools.Period`), `{ start, end }` with `start` included and `end` excluded, or null for no period; `Period.valid(value)` says whether a value is one. Months are named in the language of the tools' words: `labels: Collection.Tools.labels.es` gives `locale: 'es'`, and a product's own `labels` set `locale` too. The words are `anytime`, `days`, `span` and `locale` in `Collection.Tools.labels.en` / `.es`. Delegate's cost ledger, CDN's usage report and Conduict's Usage month can adopt it in place of their own period controls; a custom range typed with two date fields has no shared form.

## Tools for more than one view (0.44.0)

When one set of filters drives more than one view of the same records (Packages' composition draws a graph and a table), React has the toolbar without a collection:

```jsx
function Composition({ state, go }) {
  const tools = useCollectionTools({ label: 'Packages', filters, state, onChange: go });
  const rows = shown(tools.state); // the query and filters the person chose
  return <>
    <PageHeader title="Composition" actions={<div ref={tools.ref} />} />
    <Graph rows={rows} />
    <Table rows={rows} />
  </>;
}
```

`useCollectionTools({ label, search, filters, state, onChange, labels, compact, delay })` places the DOM `Collection.Tools` in the element `ref` is given and returns `{ ref, state, tools }`: `state` is the tools' current `{ query, filters }`, `tools` the DOM instance (null until placed) for `focus()`. `onChange` reports the person's changes (the query after its debounce, filters and clearing at once). `state`, usually from the address, is restored silently whenever it differs, and its echo keeps the field and its focus. A change of `label`, `search`, the filters' definitions, `labels`, `compact` or `delay` makes a new toolbar that keeps the state. `<CollectionTools {...props} ref>` draws the same toolbar where it is rendered; its ref's `focus()` opens the search. `CollectionTools.labels` is `Collection.Tools.labels`. In the DOM, `new Collection.Tools(...)` already serves it.

## An empty list's action (0.44.0)

React `Collection`'s `empty` holds the section's one action (L10), as the DOM's does: `{ title, body, action }`, where `action` is `{ label, href, onSelect }`, drawn as `EmptyState`'s primary action with `onSelect` read when it is pressed (without `href`), or React content such as the product's own button opening a dialog (CDN's **Register application**, Delegate's **New request**). The DOM `Collection` takes `{ label, href, run }` or a node. Both draw it in `EmptyState`'s actions row (`.bui-empty-actions`), so the box keeps its one inset below it, and both read `empty` on each draw: new words or a new action show at the next read, so a product that learns its action later keys the list or reads it again. A filtered empty offers **Clear search and filters**, never the first action.

React `Collection` has no `onRender` (decided in 0.44.0): `render(row)` columns and `row` give a list's content, and no React consumer of `Collection` needs a callback after a redraw (Delegate's lists, its only React consumer, draw their cells with `render`). The DOM `onrender` stays for plain DOM products (Projects' and Conduict's lists use it).

## What differs among the rows (0.44.0)

The rule L3 says an attribute on a row only where the rows in view do not all share it. `new Differ(rows).in(row => row.machine)` is true when the rows hold two values or more; empty values (null, undefined, '') never count, so one machine and rows with none still share it. `Differ.of(rows, pick)` answers one attribute. `Collection`'s `row(row, { differ })` (DOM and React) is given a `Differ` of the rows drawn, page by page.

## A region below a row (decided in 0.44.0)

L2 puts a cause and its repair in the context below the row. That region stays outside the row: the row is the whole row's opening target, lit and ringed as one, and a repair inside it would sit under its stretched link. The item is a product's `li` holding `ListRow` with `tag: 'div'` and, after it, a `div.bui-row-under` (0.30.0), which starts on the row's name (`--bui-row-axis`) and shares the item's divider. `ListRow` takes no `detail` option.

## Verification scope

Focused React checks cover external placement, target changes, StrictMode cleanup, restored filter state and current matching callbacks. Typed fixtures cover the DOM constructor, both collection getters, React outlets and filter-state contracts, and since 0.44.0 the period filter, `Period`, `Differ`, the standalone React tools and an empty list's action (`tests/fixtures/types/collection.ts`, `.tsx`). These checks do not establish toolbar layout, focus-ring visibility or product browser acceptance. `tests/list-rules.test.mjs` holds Down from the search, the arrow keys, marked matches and the end line in happy-dom; the browser check "a grouped list" measures the labels, marks, menu and end line in Chrome ([0.21.1](reviews/2026-10-23/release-0.21.1.md)). Since 0.39.0 `tests/inbox-tools.test.mjs` holds the inbox's external toolbar and filtered empty, `tests/ends.test.mjs` the shared end line and `tests/react-lists.test.mjs` React's inbox outlet, `useRowKeys` and `EndLine` ([0.39.0](reviews/2026-10-27/release-0.39.0.md)). Since 0.44.0 `tests/period.test.mjs` holds the period filter, `tests/react-tools.test.mjs` the standalone tools driving two views, `tests/react-collection-empty.test.mjs` an empty list's action (DOM and React) and `tests/differ.test.mjs` `Differ`; the browser check "tools:" (`acceptance/checks/tooling.mjs`, the `tools.html` pages) chooses a period in a page header's tools at 390 and 1280 px and measures an empty collection's action.
