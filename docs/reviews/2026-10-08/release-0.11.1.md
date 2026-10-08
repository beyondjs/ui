# Release 0.11.1 — 8 October 2026

The Conduict interface agents adopted [0.11.0](release-0.11.0.md) in their round and reported five
gaps they had to work around locally: a `ChoiceChip` drew a second border, a `Facts` row's Copy did not
read on its value's line, a composer with settings grew a toolbar row on a phone (Conduict built its own
"Options" menu below 30rem), a suggestion list could not say it was cut, and products could not reach
the family tooltip or the sidebar's age wording. 0.11.1 answers each in the package, the way every
product would want it. No token changes: token set 0.4.0 stays, with D67's three layout lines still
`pending`.

## What changes

| Part | 0.11.1 |
| --- | --- |
| `ChoiceChip` (corrected) | The holder draws no box: the picker's chosen-chip rule, which the holder's `bui-chip` class also matched, is scoped to its list (`.bui-chips > .bui-chip`), so the chip's one border is its button's |
| `Facts` (corrected) | A row's action sits at the row's end on the value's first line, its words on the value's baseline, beside the label and under it; a long value wraps beside the action instead of pushing it to a line of its own; its target grows around its words |
| `Composer` (changed) | `compact` (default `true`): below 30rem of composer the settings and Attach fold behind one **Options** control, first in the toolbar (the `more` glyph of the closed list, named "Options" / «Opciones», with the family tooltip), so the toolbar keeps one row. A disclosure: pressed, they show beside it from the first row and the actions take the next; Escape (after an open chip menu) and a sent message fold them, focus back on Options. Only while there is something to fold; `compact: false` keeps 0.11.0's wrapped toolbar. `composer.fold` (`open`, `button`, `toggle(open?)`) |
| Suggestions (changed) | A source may answer `{ items, total }`, `{ items, more: true }` or `{ items, note }`: the list ends with "50 of 120 · keep typing to narrow" (or "First 50 · …", or the note) under the options, which scroll above it; the line describes the listbox and is said once with the answer, in place of the count |
| `Hint` (public) | The family tooltip of glyph-only controls, exported from the root, `/dom` and `/react` (React `useHint()`), for a product's own controls with `data-bui-hint` and an `aria-label`; its `destroy()` now releases its listeners on the root |
| `Age` (new, public) | The sidebar's age wording without a DOM: `new Age({ locale, labels?, now? }).of(moment)` answers `{ label, title, datetime }`; `Age.labels` in English and Spanish are the `Sidebar`'s units, and the sidebar's entries say their ages through it |

## Choices and deviations

- **Options is the default.** Every product with settings or Attach in a composer on a phone wants the
  toolbar to keep one row, and a product without either sees nothing, so folding is on unless
  `compact: false`. This changes 0.11.0's narrow toolbar, whose acceptance check now runs with
  `?compact=off` and keeps its assertions.
- **A disclosure, not a menu.** What folds are controls with menus of their own (chips) and Attach; an
  ARIA menu cannot hold them, so Options is a button with `aria-expanded` and `aria-controls` that
  shows them in place. Conduict's own menu offered "Attach files" and a summary of the model and the
  autonomy; the shared control shows the chips themselves, whose faces say their values.
- **Options sits in the toolbar, before the start** (`.bui-composer-bar`'s first child), so the start's
  children are 0.11.0's and its unit test is unchanged.
- **The cut line is fixed under the options**, not sticky inside their scroll, so the option the arrows
  make active is never under it.
- **`Age` picks its units by the locale's language** when `labels` is not given (Spanish for `es`),
  because its dates and its words must agree; `labels` still replaces any unit.

## What ran

All on the final source, whose packed tarball is `sha512-SohuTTSSuNoEJ47byF5QjlvIpp7XITZHrNIQjulXsfkr2ueEm7+5UBKfuw1mPUq5Bs68PDx98vobL1XoxGoB7w==`
(`beyond-ui-0.11.1.tgz`, the copy handed to the round's Conduict agents).

- `npm test`: 438 tests, 438 pass, 0 fail (417 before; new: `fold.test.mjs` 7, `partial.test.mjs` 4,
  `shared.test.mjs` 5, `react-shared.test.mjs` 4 and its run on React 18.3.1; `spanish.test.mjs` adds
  `Age`'s sets).
- `npm run types`: clean, with the typed consumers `shared.ts` and `shared.tsx` and their expected
  errors.
- `npm run acceptance`, three consumers (plain DOM, React 19.3.0, React 18.3.1), 231 checks each run
  (222 before; 9 new in `checks/folding.mjs` on the `thread.html` pages):
  - Chrome 154.0.8037.98: 231 of 231, a full run on the final tarball.
  - Firefox 155.0 (Playwright's build): 231 of 231, a full run on the final tarball.
  - WebKit 26.6 (Playwright's build): 229 of 231 in a full run on the final tarball; the two failures
    were the new keyboard check pressing Tab, which WebKit on macOS moves among buttons only with
    Option held (as Safari does by default, and as the 0.4.0 navigation check already does). The check
    now presses Option+Tab in WebKit; that check (both consumers) passed 2 of 2 on the same tarball.
- Corrected before those runs, from runs on earlier sources: Options was the toolbar's icon size and
  centered on the toolbar, so when shown it sat beside the second line of chips; it now takes the
  toolbar's control size and, while shown, the first row's top. A `Facts` action first aligned only by
  baseline still wrapped under a long value; the row with an action now keeps it on the value's first
  line.

No screen reader was used; the tooltip, the announcements and the ARIA attributes were asserted from the
DOM. A pass is package evidence only, not Conduict's adoption.

## Family reference synchronization

**Synchronization blocked** in this assignment, as for 0.11.0: the family reference (Beyond Suite's
`branding/`) is outside the worktree this release was built in, and the suite's principal checkout was
not to be touched. Affected: the component catalog (`ChoiceChip`'s border, `Facts`' action, the
composer's Options on a narrow composer, the suggestion list's cut line, `Hint` and `Age`). Owner: the
round's coordinator. Remaining: re-vendor 0.11.1 in the reference and model the narrow composer's
Options in its conversation surfaces once Conduict adopts it.
