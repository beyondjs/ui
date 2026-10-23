# Collection search and filters

`Collection` and `DataTable` share collection tools for finding records. Products provide actual filters, matching rules, navigation and actions. The toolbar never creates data or invents filter choices.

## Choose placement

Both DOM classes and React adapters accept `tools`:

| Value | Behavior |
| --- | --- |
| `compact` (default) | Search opens from its named control; Filters groups the supported choices. Applied query and filter values remain visible. |
| `expanded` | Search stays expanded within the collection; Filters keeps its grouped choices. |
| `external` | The collection owns the toolbar and state, while its caller supplies the placement. |

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

Placement follows the rule L8: the page header's action region, before the page's own actions, when the list is the page; a section's heading line when the list is one of several or a tab. The Beyond Suite's `branding/docs/list-patterns.md` states every rule. A date or period filter has no shared kind yet.

## Verification scope

Focused React checks cover external placement, target changes, StrictMode cleanup, restored filter state and current matching callbacks. Typed fixtures cover the DOM constructor, both collection getters, React outlets and filter-state contracts. These checks do not establish toolbar layout, focus-ring visibility or product browser acceptance. `tests/list-rules.test.mjs` holds Down from the search, the arrow keys, marked matches and the end line in happy-dom; the browser check "a grouped list" measures the labels, marks, menu and end line in Chrome ([0.21.1](reviews/2026-10-23/release-0.21.1.md)).
