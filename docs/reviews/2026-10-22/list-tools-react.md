# React collection tools and declarations

**Evidence:** isolated source candidate, 2026-10-22. The candidate combines the shared DOM tools with React adapters and declarations. It is not installed in a product, packaged, published or accepted by the owner.

React `Collection` and `DataTable` accept compact, expanded and external tools. In external mode, `toolsTarget` receives the existing toolbar element, without duplicating its state. The adapter releases an old outlet, handles a target supplied after mount, avoids attaching a destroyed instance and cleans up on unmount. DataTable's filter predicates read current React props. Filter state passes through the existing callbacks and restoration path.

Declarations expose DOM `Collection.Tools` as the constructor and both DOM collections' `tools` getters. Shared tool types are types only, not additional runtime exports. DataTable filter state stays optional for compatibility with tables without filters. The catalog type includes `filter`; the unlabeled icon set is unchanged because Filters keeps a visible label.

## Executed checks

- `node --test tests/react-collection-tools.test.mjs`: seven focused tests passed on React 19.3.0, including StrictMode.
- The same test file with `tests/support/react.mjs` pointed at an existing React 18.3.1 installation: seven passed, with no installation performed.
- `tsc -p tests/fixtures/types/list-tools.tsconfig.json`: passed the new public API fixture and declarations, including invalid-outlet and unlabeled-filter negative cases.
- Syntax checks passed for the two adapters, the outlet hook and the focused test file.

The checks cover outlet moves and mode changes, detach/reattach and unmount, state restoration without a user-change callback, current predicates with unchanged rows/state, retained focus, controlled loading/failure during a predicate refresh, inline empty filters without a render loop, callback filter state and a callback-ref outlet that appears after mounting. The predicate-only regression failed against the earlier adapter before the fix: its rows remained matched by the old predicate. The source fixture uses fictional machine names and ownership values.

## Remaining validation

These DOM-unit checks do not measure rendered toolbar alignment, focus rings, narrow wrapping, both themes, touch targets or reduced motion. Coordinated browser validation and product adoption remain necessary. The shared DOM implementation's own checks are recorded by its owner; no full suite, build, install or browser matrix ran in this adapter assignment.
