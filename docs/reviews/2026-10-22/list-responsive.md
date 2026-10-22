# Responsive list meaning — 2026-10-22

Evidence type: isolated source candidate, focused happy-dom assertions and stylesheet-source checks. This is not measured layout or product acceptance.

## Source observation

`src/styles/list.css` hid every `.bui-row-fact` below the row's 30rem container threshold. This contradicted the DOM component's description of facts moving below metadata and removed useful object context.

`src/styles/table.css` hid the table header and showed only secondary values below 36rem. Accounts' member list supplies distinct Joined and Last active date columns, so two dates lose their visible meanings in this presentation. Accounts and Conduict also supply independently named action columns, which can omit a redundant narrow label explicitly.

## Candidate contract

- Narrow object facts remain visible and wrap, including a long unbroken value. Name, metadata and end content keep their existing semantic order. The existing shared action-column layout and row interaction residuals remain in the base.
- A narrow `DataTable` keeps labeled values inline, wrapping as a record. Empty cells leave no label or separator. DOM header nodes supply their text as the narrow label. Real headers and row scopes remain intact.
- The additive column option `summary?: boolean` omits the repeated narrow visual label only for self-describing content or independently named actions. It does not change the table header, values, search or sort. DOM and React declarations expose it; the existing React adapter already forwards column options.
- Interactive descendants in lead, metadata and end slots, including native labels and tooltip anchors, sit above the name's stretched target. The name retains navigation through the rest of the row.

No new table mode, object-list conversion, per-field card, scale or weight change is included.

## Executed checks

`node --test tests/list-responsive.test.mjs` passed 6/6 checks in an isolated source copy using the checkout's existing dependencies. The physical fixture is `tests/fixtures/list-responsive.mjs`.

The assertions cover object name/context/fact/action structure; two distinct date labels; summary and empty markers; actual table header/row semantics and sorting; textual labels from DOM header content; narrow wrapping source rules; and the selector that raises native slot controls and tooltip anchors while excluding the row name.

Stylesheet-source assertions establish rules, not computed layout or pointer hit testing. No build, package, installation, browser, real-checkout write or product adoption was performed. Declaration additions were source reviewed; no type-run claim is made.

## Integration and remaining validation

C owns integration with the toolbar candidate and coordinated package validation. Merge the additive column declarations and component guide changes; never overwrite those files with this candidate's base. Recheck base hashes immediately before integration.

Measured fit at 320–390 px and wide widths, both themes, Chrome/Firefox/WebKit, actual pointer and keyboard access to controls and tooltip anchors, and native table accessibility remain required. Products must review each `summary: true` choice against the values actually shown; ambiguous dates and counts retain labels.

Family reference synchronization is blocked on coordinated integration, distribution, affected consumer/reference adoption and composed validation. E owns the reference representation and pending-work register; affected shared patterns are `ListRow`, `DataTable` and Collection's list presentation. No reference simulation or owner acceptance is claimed.
