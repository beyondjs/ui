# Release 0.5.1 — 4 October 2026

A patch release of `@beyond-js/ui` over [0.5.0](../2026-10-03/release-0.5.0.md), answering two reports from the first adoptions of 0.5.0. The token set is unchanged (0.2.0), every 0.5.0 option keeps working, and nothing is published or vendored into a product here: each product that vendored 0.5.0 (Accounts, CDN, Conduict, Delegate, Projects, Snapshots, Workspace) re-vendors 0.5.1 in its own assignment (`npm run pack:consumers -- <consumer>`).

## What changed

| Report | Cause | Change | Where |
| --- | --- | --- | --- |
| Workspace's family-bar journey found three sign-out entries (`.bui-family .bui-family-signout`) in the profile menu and attributed them to the bar being drawn again when its sign-out label changed; a probe of a settled page found one | Not the redraw. A `Disclosure` that closes leaves an inert picture of its panel easing out where it was (since 0.1.5); the picture keeps the panel's classes so it looks the same, and it lived until its movement ended or 400 ms passed, even when the menu opened again. A menu closed twice and opened again within that time (Escape, then an entry chosen, then opened to sign out, as the journey did) held its live entry and two pictures of it. Drawing the bar again, with a descriptor that arrives later or as a new bar with other account options (DOM and React), leaves one entry and no listener | A disclosure keeps at most one picture, removes it when it opens again and when it is destroyed, and times its removal through the component (`later`), so an open panel never has a copy beside it and a query for an entry's class in an open menu finds one. The picture still eases out after a closing that is not followed by an opening | `src/dom/disclosure.js` |
| CDN had to cast `Select.tip` (public since 0.5.0, used by the React `Select`) because the declarations lacked it | Missing declaration | `Select.tip(control: HTMLSelectElement): NameTip` and the `NameTip` interface (`tooltip`, `destroy()`) are declared. The other public members 0.5.0 added (`Clock`, `Steps`, `Awaited`, `Freshness`, `TechnicalDetails` with their statics, `Tooltip`'s `when`) were already declared; `Leave`, `Manage`, `AccountMenu`, `Cut` and `NameTip`'s class are internal and not exported | `types/dom.d.ts` |

Workspace's workaround (keeping the label "Sign out of Beyond" while the descriptor loads) remains valid; with 0.5.1 a changing label no longer matters for the entry count, which never depended on it.

## Checks

The new checks failed before the change and pass after it: the unit tests found 3 entries where 1 was expected (DOM and React), the acceptance check found `entry,picture,picture` in Chrome for all three consumers, and `npm run types` reported `Select.tip` missing.

| Check | Result |
| --- | --- |
| `npm test` (new: `disclosure.test.mjs`, a reopening removes the picture and destroy removes one still easing out; `signout.test.mjs`, one entry after closings, a descriptor arriving later and a bar made again with another label, and no listener left on the document or the window; `react-operations.test.mjs`, the same with the React `FamilyBar` whose label changes as the descriptor arrives, on React 19 and, through `react18.test.mjs`, 18.3.1; listeners measured by `tests/support/listeners.mjs`) | 230 of 230 |
| `npm run types` (`Select.tip` returning a `NameTip`, its `tooltip`, and an expected error for an element that is not a select) | No diagnostics |
| `npm run acceptance` (new in `checks/operations.mjs`: a profile menu closed and opened again at once holds one sign-out entry, and a settled bar one, in the DOM, React 19 and React 18 consumers) | 140 of 140 in Chrome 154, Firefox 155 and WebKit 26.6, run one after another |

Tarball: `beyond-ui-0.5.1.tgz`, `sha512-k2MAaVQxqinSaOpU00QlcFkWydPnAiJjC7McWsPmX/j/C143n1pzlx0EEHoll9oJd/Z29+hIFKuc8q2A85ZVLQ==` (the acceptance runs' packed artifact and `npm run pack:consumers`).

A pass is package evidence only, not a product result.

## Family reference synchronization

No reference impact: the change removes a transient duplicate copy of a closed menu's panel and adds a type declaration. No visible state, wording, navigation or refusal changes; the reference models the menus, not their closing pictures.
