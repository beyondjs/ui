# Release 0.4.1 — 3 October 2026

A patch release of `@beyond-js/ui` over [0.4.0](release-0.4.0.md), answering what the first adoptions of 0.4.0 found: the Projects interface's record of the same day (Projects' own chooser offered "Project overview", the page the person was already on), Delegate's copy of the family's product names, and a project chosen from the bar outside a project leaving a product that binds no mappings (Snapshots) for Projects. The token set is unchanged (0.2.0), every 0.4.0 option keeps working, and nothing is published.

| Change | Where |
| --- | --- |
| "Project overview" is never offered when the bar's `product` is `projects`: there it is the page in view. Every other product keeps it inside a project | `src/dom/family/places.js` |
| A project row without `here.url` goes to the current product's entry with `project=<id>` whenever that entry is open (available, or unavailable for an advisory reason), inside a project or outside one. Before, an entry outside a project carries no `?project=` and was refused, so the row left for Projects; every signed-in product accepts the `/?project=` arrival. A product with no open entry still sends the row to Projects | `src/dom/family/places.js` |
| `productNames`: the family's display names by product id (Projects, Workspace, Delegate, CDN, Snapshots, Conduict, Accounts, Desktop, Docs), frozen, the same object the bar draws from, from `@beyond-js/ui` (`/dom`) and `@beyond-js/ui/react`; typed `FamilyProductNames` (every `FamilyProductId` a `string`, any other id `string \| undefined`, read-only) | `src/dom/family/labels.js`, `src/dom/index.js`, `src/react/index.js`, `types/family.d.ts`, `types/react.d.ts` |

## Checks

| Check | Result |
| --- | --- |
| `npm test` (with `family-projects`: no overview in Projects inside a project and the overview kept in another product; rows outside and inside a project staying in an open entry, an advisory entry, and Projects for a closed or missing entry; `productNames` equal to the bar's names, frozen, one object for DOM and React) | 191 of 191 |
| `npm run types` (`productNames`, `FamilyProductId` in both typed consumers, with expected errors for a write and an unknown id) | No diagnostics |
| `npm run acceptance` | 123 of 123 in Chrome 154, Firefox 155 and WebKit 26.6, run one after another |

A pass is package evidence only. The Projects interface and Snapshots re-vendor 0.4.1 in the same assignment and record their own checks; other products adopt it in their own assignments.

## Family reference synchronization

Pending in the suite's branding round of 2026-10-03: the reference's bar in Projects has no "Project overview" in its chooser, a project chosen outside a project stays in the product whose entry is open, and the reference may take product names from `productNames` instead of its own copy.
