# Release 0.16.0 — 17 October 2026

The second wave of the family audit of 2026-10-17: what 0.15.0 left out because the products' rebuilds
(Conduict's C1, Delegate's E4, the Desktop as Beyond Home's E5, CDN's E7) need it. Token set 0.6.0,
unchanged. Every 0.15.0 API is unchanged; everything here is additive. Implemented and verified locally;
not published, not adopted by any product yet.

| Finding | 0.16.0 |
| --- | --- |
| DQ-21: ⌘K as the main navigator | `CommandPalette` (DOM, React with a ref): a modal field over results grouped by the sources the product (and what it hosts) contributes, each asked as the person types with an `AbortSignal` and a bound, a source that does not answer said in its group; recent items on this device; arrows across groups, Enter, ⌘/Ctrl+Enter, Escape, ⌘K / Ctrl+K |
| DQ-15: choice cards | `ChoiceCards`: native radios drawn as cards with title, detail, facts and state; applied at once; a closed card says why |
| DQ-03: the missing step | `Composer`'s `step: { label, run }` (React `{ label, onSelect }`): Send names the step ("Choose a machine and send") and performs it, then sends; `false` keeps the text |
| DQ-19: one bar on a phone | `sidebar.merge(bar)` (React `<Sidebar merge />`): the family bar's menu button opens the drawer, the product row goes; `Header.toggle` and `FamilyBar.toggle` setters, `FamilyBar.of(element)` |
| DQ-09: one primary per region | `Primaries`: a development warning, once per region, started by `Page` in a development build |
| CNV-10: scoped approvals | `CommandCard`'s `decisions` and `ondecide` ("Allow once", "Allow for this conversation", "Deny and say why" with its note) and `editable` (the command corrected before allowing) |

## Migration notes for 0.15.x consumers

None required. Visible only where a product opts in, with one exception: in a development build a `Page`
now warns in the console about a region with two primary actions (`Primaries.enabled = false` turns it off).
A product that enables `CommandPalette`'s `shortcut` turns off the `Sidebar`'s own `shortcut` (one ⌘K a page).

## Adoption notes by product

- **Conduict (C1).** One `CommandPalette` per page with sources for conversations, repositories, machines
  and actions ("New conversation", "Create a machine"), `recent: { key: 'conduict' }`, `shortcut: true`; drop
  the titled ⌘K modal and the sidebar's `shortcut`. The composer's `step` replaces the disabled Send and the
  toolbar sentence ("Choose a machine and send", "Connect Claude Code and send"); its `run` opens the machine
  chooser or the sign-in and answers whether to send. Machine sizes and where they run as `ChoiceCards`
  (DQ-15). Approvals as `CommandCard` with `decisions` mapped to what each engine supports (Codex
  approve-for-session, Claude Code's "don't ask again", "Deny and say why" sending the note as the next
  instruction) and `editable` where the runner accepts a corrected command (CNV-10). `sidebar.merge(bar)` on
  every page (DQ-19); drop the sub-bar's "+ New".
- **Projects.** Its repositories' write grant and GitHub settings as `ChoiceCards` applied on change (DQ-15);
  `CommandPalette` with project and repository sources; `merge` on its pages.
- **Delegate (E4).** `CommandPalette` for requests and definitions; `ChoiceCards` for a plan or a delivery
  target; `merge` on its pages.
- **Desktop as Beyond Home (E5).** One `CommandPalette` as Home's search, its sources from Projects (projects),
  each product's relay (recent work) and actions; a hosted product's palette adds its sources through
  `palette.sources`.
- **CDN (E7), Snapshots, Accounts, Packages.** `merge` on their pages; `CommandPalette` where they have more
  than a handful of destinations; `ChoiceCards` for plan or region choices.
- **Every product.** Build with `process.env.NODE_ENV` defined as `development` in development to get the
  `Primaries` warning, and fix every region it names.
- **Family reference (branding).** Catalog `CommandPalette`, `ChoiceCards`, the composer's step, scoped
  approvals and the merged phone bar; the manual's rule "one primary per region".

## Validation

- `npm test`: every suite passes, among them `palette.test.mjs`, `cards.test.mjs`, `step.test.mjs` and
  `decisions.test.mjs`; `npm run types` passes with `wave.ts` and `wave.tsx`.
- `npm run acceptance` adds `acceptance/checks/commanding.mjs` on the `wave.html` page (DOM and React): the
  palette by ⌘K / Ctrl+K in the top layer with its keys, recent items and focus back, at 1280 and 390 px; cards by
  the arrows; the composer's step then the send; scoped decisions with a note; one bar at 390 px with the
  drawer opened by the bar's button and focus back, no button beside a permanent sidebar; the primaries
  warning. Results by engine are in the addendum.
