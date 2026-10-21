# One left edge and one place for each fact in UI 0.19.1

## Change

The owner reviewed Conduict's Live application page on 2026-10-21 and found the same class of defect flagged on 2026-10-10, 10-17 and 10-20, each time fixed where it was seen. A band above the page named the machine, its state and its price, 9 px off the page's edge. The header named the machine and its state again, and so did the gate's card below it. The copy the page was about, "Checkout", sat between the machine's state and who can open it.

A sweep of Conduict's project pages found the same step on every page. It also found the shared parts adding their own: a page's first tab and every list row's words sat 12 px inside the H1's edge. On a wide resource page, the title line's actions ended 1,095 px from the title at 1440 px.

The family's decisions D159 (one left edge, one fact in one place), D160 (where an object lives is the path) and D161 (persistent chrome is a glance and a door), approved on 2026-10-21, state the rules. This release gives the shared components what those rules need.

- **`PageHeader`'s `kind`** (DOM and React): the object's kind or variant beside the H1. It takes words, drawn as a quiet tag ("Checkout"), or one control that chooses among the object's siblings. It sits after the H1 and before the one status, is never part of the H1's name, and takes no room without one.
- **A resource page's title line within reach.** On the `detail` template the title, its kind, its status and its actions span at most a form column and its side panel (64rem, LR-03), however wide the region. The tabs and the facts keep their width.
- **The rail's `foot`** (`Sidebar`'s `rail.foot`, React `onClick`): the product's one object in use, kept in view at the rail's end, as code editors keep their remote machine. It is the object's glyph with its state's `Status` mark on the glyph's corner, named "{label} · {state}" in words, which the shared tooltip shows. A press hands the control to the product, which opens its own panel. A change of state patches the same control and keeps focus.
- **The first tab on the content edge.** A page's tabs start with the first label on the H1's edge, and the current tab is marked under its words only. The row's line keeps the edge.
- **A list's rows on the content edge.** `.bui-rows` hangs its rows' inline padding into the gutter. A hovered or current row's surface reaches past its words while each divider stays on the edge. A list inside a row never hangs again, so it never reaches past the page; Conduict's Home found that case, a repository's copies under it.
- **A table's first and last columns on the content's edges**, as its lines are.
- **Still marks that never mislead.** Under reduced motion a spinner is work in progress's half-filled circle, never the open ring that is the shape of what rests. An indeterminate bar is a dashed track along its whole width, never a band held in one place that would read as a share done.

The public additions are `PageHeader`'s `kind` (option and setter, DOM and React) and the rail's `foot` (`SidebarRailFoot`). Every other API is unchanged. The visible changes are the aligned tabs, rows and table columns, the capped title line on detail pages and the reduced-motion marks. A product that restyled `.bui-rows` to `margin: 0` keeps its rows inset until it drops that override (Conduict dropped its two).

## Verification

Each item says what ran.

- **Unit and contract tests** (`npm test`): 683 tests passed before the change and 686 after it, and `npm run types` passed. `page.test.mjs` and `react-page.test.mjs` hold `kind` (words, a component, a node, none, its place after the H1 and before the status, and DOM and React markup equal with a kind), and `sidebar-rail.test.mjs` and `react-sidebar-rail.test.mjs` hold the `foot` (last in the rail, named with its state in words, its mark by tone, the press handing over the control, a patch that keeps focus and survives the sections' updates, none). `foundations.test.mjs` and `hierarchy.test.mjs` passed over the changed stylesheet.
- **Browser acceptance** (`npm run acceptance`): its layout fixture gains a kind beside the H1, a list of `ListRow`s and a list inside its last row, and its `page:` checks gain one. That check measures every left edge of the column against the H1's at 390, 1024, 1440 and 1920 px, the kind on the H1's line, and a resource page's actions within 64rem of its title. The existing check of no sideways scroll at 320 px failed with the nested list before its rule and passes with it. Chrome: 325 of 325 checks passed. Firefox: 325 of 325. WebKit: 324 of 325. The failure, "sidebar at 1440 px is permanent…" for the DOM consumer, timed out waiting for a mouse wheel to scroll the page. It fails intermittently at 0.19.0 too: the same check, run alone on a clean 0.19.0 worktree, failed in two of three runs, and on 0.19.1 in three of four. It does not touch a component this release changed. The `page:` checks were run again after the nested list's rule, with 8 of 8 passing in each engine.
- **Consumers:** Conduict vendors 0.19.1 and holds the same rules on its own pages with `frontend/acceptance/screens.mjs` (its record: Conduict's `docs/reviews/2026-10-21/screen-anatomy.md`). The family runner's `frame` phase now measures every left edge in every running product. Its first run against the local composition, which still served the earlier Conduict and Accounts, passed Projects and named rows 12 px inside the H1's edge in Conduict and Accounts at 390 px. Conduict's own run of 0.19.1 passes. Accounts adopting 0.19.1 is its own follow-up under D157.

These are local results with fixture pages and a local composition, not hosted or owner acceptance.

## Family reference synchronization

Synchronized in the family reference's round `placed` (reference 0.38.0). It records D159, D160 and D161, vendors this tarball, and catalogs what 0.19.1 changes in `PageHeader`, `Sidebar`, `Tabs`, `ListRow`, the tables, `Awaited` and the spinner (matrix row M987). Every other consumer stays on 0.19.0 until its own round (FAM-75).
