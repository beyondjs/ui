# Release 0.7.0 — 4 October 2026

A minor release of `@beyond-js/ui` over [0.6.4](release-0.6.4.md): the "Choose, never type" components of phase 1 (rule D56, the suite's repository connection review of 2026-10-04, sections 6, 8 and 11, its `design.md` S2, the family reference's "Choose, never type" inventory CNT-93 to CNT-95 and shared pieces 1 to 9, and FAM-40). Commissioned by the suite's coordinating session for the family round of 2026-10-04; the API needs of Projects (the add task's resource picker) and Conduict (the phase 1.1 side sheet and the composer's branch chooser) were forwarded by that session and built to. The token set is unchanged (0.3.0). Nothing is published; consumers vendor the tarball.

## What is added

| Component | What it does | Consumers named |
| --- | --- | --- |
| `SideSheet` (DOM, React) | A native modal `<dialog>` at the inline end, the window's height, `--layout-form` (or `--layout-standard`) wide and the whole width below 1024 px; focus to `[data-autofocus]` or its title, kept inside, returned to `restore` or the opener; never closed by a press outside; nothing closes it while `busy`; `error(node)` shows a failure at its top without closing it | Conduict (phase 1.1, hosting Projects' add task), Projects, Delegate |
| Resource picker (`Picker`) | "From [account ▾]" with "Connect another" and unusable accounts explained; a `gate` (`Unavailable`) in place of the list, asking the source nothing; every request bounded (`bound`, 20 s) and stated as unavailable, never empty; rows with an avatar or glyph, "Private" with a lock, a fact, the update time, one state and marks with their reasons, no controls inside a row; a suggested group; a paste recognizer with `picked`, `refused` and `missing` outcomes; the "Can't find it?" footer in every state; Spanish | Projects' add task; later Delegate, CDN, Workspace, the Desktop |
| `RefChooser` (DOM, React) | The default branch first and marked, search past 15 by beginning or segment, type-ahead, "Use a commit or another ref…" as a field in place checked by Git's rules and the product's; loading, unavailable with Try again and empty states; a field or an inline layout | Conduict's composer and add form, Delegate, CDN |
| `ProjectPicker` (DOM, React) | The family bar's project list as a form control with each project's state here; denied never chosen; `only: 'unset'` | Delegate's adopt, Workspace, Conduict |
| `SecretField` (DOM, React) | Connect first; the pasted credential folded as the last resort; "Stored · Replace", nothing submitted until Replace | CDN registries, Delegate's Supabase, Workspace's Codex key, Projects' transition token |
| `Field` `suggest`, React `useSuggestion` | A value derived from context, marked "Suggested", followed until the person edits it; an emptied field takes it back | CNT-22, CNT-52 to CNT-54, CNT-59, CNT-72, CNT-73, CNT-75 |
| One option as a statement | `Select`, radio `Choices` and `ChoiceMenu` show one option that can be chosen as text (an `<output>` a label names) and submit its value; `statement: false` keeps the control | CNT-08, CNT-38, Conduict's infrastructure |
| `ChoiceMenu` | React `ChoiceMenu` (CNT-94); type-ahead; a search field past `ChoiceMenu.threshold` (15) or a given number; `name`; `labels` with Spanish | Every React product |
| `Draft` | Builds an address carrying `environment`, `provider`, `agent`, `from` and `for` (in the search or a hash route) and reads it back; `for` falls back to `from` | CNT-55, CNT-60, CNT-61, CNT-12 |
| `Collection` column priority | Columns with `priority` leave, the highest number first, by measured widths and the region's width; one toggle reveals them; Spanish labels | FAM-40 |
| `ListDetail` (DOM, React) | The detail beside its list on a region 72rem wide or more, alone with its way back below | FAM-40, Projects' Repositories |
| `ProviderWindow` (DOM, React) | A provider's window opened from a press, followed while open, ended by the product's bounded `read()` of the attempt; blocked, closed early, silent read and this-tab cases | Projects (GitHub), Delegate (Supabase) |
| `StatusRow` (DOM, React) | One state with its freshness, reason, who can change it, facts, one action and More | Projects, Conduict, Delegate, CDN |
| `CopyMessage` (DOM, React) | A message, link or command to copy, bounded, with the refused case said and the text selected | Projects, Conduict |

## Behavior changes consumers see

- **One option is a statement.** A `Select`, a radio `Choices` or a `ChoiceMenu` (without actions) that offers exactly one option that can be chosen now shows it as text and submits its value; `Select.control` is then an `<output>`, `ChoiceMenu.value` that option's value and nothing opens. Pass `statement: false` where a product needs the control. A single checkbox is unchanged. Two of the package's own tests that used one option to test the menu or a select's tooltip were given a second option.
- **`ChoiceMenu`'s list is a panel.** The floating `.bui-choice-list` is now a `div` holding the `ul[role="menu"]` (`.bui-choice-items`) and, for a long list, the search field; a product that styled `ul.bui-choice-list` restyles the panel.
- **`TechnicalDetails`** copies through the shared `Clipboard` (same bound and outcome).

## Differences from what the consumers asked

- Conduict asked for a side sheet "full width minus 16 px under 640 px". The package follows `design.md` S2 and the task: the whole width below the family cut (1024 px). A task sheet never closes on a press outside, so a strip of page to press would do nothing.
- Projects asked for four not-connected states with their copy. The package has no provider contract (its architecture boundary), so they are one generic `gate` whose title, reason, owner and action the product passes in its language; the unavailable state, the footer, the account switcher and the row parts carry English and Spanish.
- Projects' typed marks (`in-project`, `in-other-project`, `archived`, `awaiting-confirmation`) are mapped by the product to `marks`, `disabled` and `reason`; the package draws generic marks.
- The paste recognizer is a product hook (`recognize`), not a built-in GitHub parser; the acceptance fixture holds a reference implementation.
- No non-modal side sheet beside the main column: section 11 does not ask for one, and `ListDetail` keeps an item beside its list on wide regions.

## Checks

| Check | Result |
| --- | --- |
| `npm test` (new: `choose`, `chooser`, `resource-picker`, `sheet`, `rows`, `columns`, `react-choose`, also on React 18.3.1; the icon survey with an open side sheet and a status row's More) | 280 of 280 |
| `npm run types` (typed DOM and React consumers of every new API) | No diagnostics |
| `npm run acceptance` in Chrome 154 (new `checks/choosing.mjs`, 12 checks over the DOM, React 19 and React 18 consumers) | 158 of 158, on the released content |
| `BEYOND_UI_BROWSER=firefox npm run acceptance`, Firefox 155 | 158 of 158, on the same code before the version and documentation edits |
| `BEYOND_UI_BROWSER=webkit npm run acceptance`, WebKit 26.6 | 158 of 158, on the same code before the version and documentation edits |

Tarball: `beyond-ui-0.7.0.tgz`, `sha512-HtZBHpW7JDfPBuOn6CqhIsAwLrEFfK3n+Mopp3JIQdGBDwtdVyi/TYZxgfeb+gETRsvMWyk9KsDZ12MzbNk3CA==`.

Not established: a screen reader's reading of the statement, the picker's group and the sheet; a real GitHub window (the acceptance's provider is a stand-in page on the same origin); product adoption, which each consumer records in its own assignment.

## What stays open

- Products adopt in their own assignments: Projects' add task (picker, sheet-ready component, `ProviderWindow`, `StatusRow`, `CopyMessage`), Conduict's phase 1.1 sheet and composer `RefChooser`, Delegate's repository and project choices.
- Spanish labels for the remaining components (`Dialog`, the questions, `Unavailable`, `Toaster`): phase 2 of section 11.
- A one-line `Awaited` for rows (design S5) is not built.
- The text caps on the package's own components at 68ch already hold for the parts the page system names; no other cap was added.

## Family reference synchronization

Synchronized in the suite's family reference: its component catalog lists the 0.7.0 components with their consumers as pending adoption (see the suite commit of this release).
