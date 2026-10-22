# Shared collection tools candidate

**Evidence:** isolated source implementation, 2026-10-22. This candidate is not integrated, packaged, installed or owner-accepted.

`Collection` and `DataTable` now compose the same `Collection.Tools`. The tools own search disclosure, focus, debouncing, finite filter controls and visible restrictions. Products retain data loading, matching, authorization and URL ownership. Default tools are compact; an expanded-search variant supports search-first tasks; external placement exposes the same tools beside a page's existing actions. React supports that placement through a dedicated outlet, as recorded in the [adapter evidence](list-tools-react.md).

Search opens a labeled field. Escape closes the compact editor from any of its controls, prevents the native search clear and retains the query in a visible summary. Input composition is not submitted before it settles. Explicit clearing differs from closing. Restoring address state cancels stale pending input. Changing a filter flushes a pending query once; teardown cancels pending changes.

Finite filters use the existing Disclosure, Floating and Select. Applied values remain visible outside the closed panel and can be removed separately. Clear filters retains search. An unavailable restored choice is named without exposing its identifier. The filter select remains operable when other choices are disabled, allowing the person to reset the restriction. Filters uses a catalog glyph with a visible label; the closed list of unlabeled icons is unchanged.

DataTable applies declared filter predicates to its complete rows before query/sort/page processing. Filtered-out rows remain available when the restriction is cleared. No matches and no data remain distinct, with query/filter clearing retaining sort. Tools remain reachable during loading and empty results. Tables without filter definitions or input filter state preserve their previous state shape.

## Executed checks

- `node --test --test-concurrency=1 tests/list-tools.test.mjs`: eight focused happy-dom tests passed, including disabled filter choices and Escape from the clear control.
- `node --test --test-concurrency=1 tests/table.test.mjs`: eight existing table tests passed after updating the intentional empty-state tool-visibility expectation.
- `node --test --test-concurrency=1 tests/collection.test.mjs tests/columns.test.mjs`: eight existing collection/column checks passed.
- Focused catalog/closed-icon tests passed; the new glyph is distinct and Filters retains its visible label.

The React adapter evidence records seven checks on each of React 18.3.1 and 19.3.0, plus the scoped declaration fixture. These are isolated source/DOM checks, not product integration. No package installation, build, browser or full suite ran. Existing table tests emit their pre-existing React act-environment warnings; their assertions passed.

## Integration and synchronization

The package integrator must merge this source with concurrent work, regenerate the stylesheet through the existing build order, package and vendor it during the coordinated acceptance turn. The candidate changes no version, generated distribution or package archive. Earlier row-action patches remain separate work; this toolbar patch does not replace them.

Family-reference synchronization remains blocked on the reference owner's consolidation and adopted consumers. Machines and Repositories have isolated product adoption candidates; other shared Collection/DataTable consumers inherit the tools after vendoring but still require placement, meaningful-filter and URL checks. The reference must represent the same controls and active restrictions. Required browser coverage includes both themes, narrow widths, keyboard/focus, floating-panel placement, long translated labels and reduced motion. No source check here establishes those outcomes.
