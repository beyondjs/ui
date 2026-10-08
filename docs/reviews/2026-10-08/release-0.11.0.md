# Release 0.11.0 — 8 October 2026

Conduict's conversation benchmark of 2026-10-08 (its `docs/reviews/2026-10-08/conversation-benchmark.md`,
"Shared components" and "The proposed design", accepted by the owner for implementation) asked the
package for the foundations of its next conversation round, reusable by the whole family: label and
value rows for resource panels, a meter that is honest about stale reports, a compact choice, a
composer that carries the turn's settings, attachments and file mentions, a panel with its own head
that takes the width a thread leaves, a thread width tier, a header that stays in view and ages in the
sidebar. The thread tier and the panel's widths are the family proposal D67 (Q-B), adopted by
Conduict: they ship as proposals in token set 0.4.0's `pending`, not as approved family rules.

## What changes

| Part | 0.11.0 |
| --- | --- |
| `Facts` (new) | Label and value rows, a description list: values at the row's end, `mono` for identifiers, commands, paths and models, a row's own action (Copy), a stale row muted with its note, an optional head (a title that names the rows, one summary value, one state in words). A value wraps under its label when the container is under 16rem (a container query). Flat. Rows patched by key, a focused action kept. React renders the same markup |
| `Meter` (new) | A use against a limit: the level past its thresholds in words (0.8 "Near the limit", 0.95 "Almost at the limit", 1 "Limit reached"; configurable), its reset, "Not reported since {time}" with a muted track, and a reset moment that has passed said stale by itself on the page's `Clock` (CB-04). `role="meter"` with its values, name and `aria-valuetext`; no motion under reduced motion |
| `ChoiceChip` (new) | A compact choice on `ChoiceMenu`: a muted label, the value and a state in words with its dot beside it (never alone), its own `state` over the chosen option's; the same menu, keyboard, statement and copy |
| `Composer` (changed) | The state line moves above the box, outside its border, with an optional action at its end (`status: { text, action }`); a `settings` slot at the toolbar's start; `attach` (paste of files without text, drop with a visible target, Attach with the `attach` glyph beside its word) handing files to the product, whose `attachments` are drawn as removable chips (thumbnail, name, size, uploading with progress, failed with its reason and Retry, ready) said once per state; `onsuggest` after a trigger (`@`): bounded asks with Looking…, No match and Unavailable said apart, the combobox pattern on the field, Enter or Tab inserting, Escape closing, never while an input method composes, never taking Enter from a closed list. Every 0.10.0 behavior kept; a message without attachments keeps its shape |
| `PagePanel` (changed) | `head`: a head of its own beside the main column (an H2 and a hide control, "Hide {title}"); a fluid width from `--layout-aside` to `--layout-aside-max` that takes what a capped main column leaves; `wide` up to `--layout-aside-wide`, the main column giving up to the form tier. Still decided before its first frame |
| `Page` (changed) | The `thread` width tier at `--layout-thread` (52rem), the proposal D67 |
| `PageHeader` (changed) | `compact`: once the title's line has scrolled out, one sticky line under the family bar (and the sidebar's row below its cut) with the title and the status and the product's own actions, from a zero-height holder that `Page` places before the header (`bar`), so nothing shifts; no motion under reduced motion |
| `Sidebar` (changed) | An entry's `age` at its end ("2 h", "3 d") with the full moment read and in its tooltip; a group's `count` beside its heading |
| Icon catalog | `attach` (a paper clip, Lucide's grid), always beside its word |
| Tokens | Token set 0.4.0: `--layout-thread: 52rem`, `--layout-aside-max: 30rem`, `--layout-aside-wide: 48rem`, listed in `tokens.pending` as the proposal D67; the rest of the set unchanged and approved |

## Deviations from the request

- **The suggestions keep the field a text box.** The request named the combobox pattern; the field
  keeps its own (multi-line text box) role and carries `aria-autocomplete="list"`, `aria-controls`,
  `aria-expanded` and `aria-activedescendant`, so assistive technology still reads it as the message
  field. `aria-expanded` is true only while options are listed.
- **A paste that carries text is the text's.** Only a paste of files without text attaches, so rich
  text copied with a picture (a document, a spreadsheet) is never turned into an attachment.
- **The list of attachments is the product's.** Remove and Retry call back; the chips change only when
  the product sets them again, so a product's upload state and the chips never disagree.
- **A meter's stale words.** "Reset since {time} · use not reported since" (the benchmark's wording)
  when a reset moment passed; a report's own staleness is the product's `stale`.
- **The panel's head is optional** (`head: true`), so a product on 0.10.0's panel keeps its page.
- **The compact line repeats the title and the status for sight only** (`aria-hidden`): the header
  says them; the product's `compact.actions` are its own controls, not the header's moved.
- **`MessageActions`** (the benchmark's answer line) was not part of this assignment.

## What ran

All on the final source, whose packed tarball is `sha512-H0JsX/LHpfYI8Xzr7LnyDyUpaJou8oTV8FSBkSC44P9LiVMNouSzcJn/I92bvYIDxT3xyTmeHcH+slxucl5R7g==`
(`dist-pack/beyond-ui-0.11.0.tgz`, the copy handed to the round's Conduict agents).

- `npm test`: 417 tests, 417 pass, 0 fail (376 before; new: `facts.test.mjs` 6, `chip.test.mjs` 4,
  `attach.test.mjs` 7, `suggest.test.mjs` 8, `thread.test.mjs` 6, `ages.test.mjs` 4,
  `react-resource.test.mjs` 5 and its run on React 18.3.1).
- `npm run types`: clean, with the typed consumers `resource.ts` and `resource.tsx` and their expected
  errors.
- `npm run acceptance`, three consumers (plain DOM, React 19.3.0, React 18.3.1), 222 checks each run
  (198 before; 24 new on the `thread.html` pages, and `thread.html` in the `prose:` check):
  Chrome 154.0.8037.98 222 of 222 and Firefox 155.0 (Playwright's build) 222 of 222, each a full run on
  the final source and tarball; WebKit 26.6 (Playwright's build) 222 of 222 in a full run on the same
  tarball with the acceptance's paste check before the Firefox fix below, then that check (both
  consumers) 2 of 2 on its final form.
- Fixed before those runs, from runs on earlier sources:
  - The acceptance's synthetic paste: Firefox keeps only the text of a `DataTransfer` given to the
    `ClipboardEvent` constructor (WebKit keeps none of it), so the check now gives the event the page's
    `DataTransfer` as its `clipboardData` whenever the engine's copy lost its files. The package was not
    changed; in Firefox a drop's `DataTransfer` keeps its files.
  - The compact line under the sidebar's product row below its cut: the shell's `:has()` first matched
    only a sidebar that is the shell's child, which a React host element is not; it now matches one
    inside it, and the check measures the line against the row's bottom.

No screen reader, no real input method, no person dragging files and no system clipboard were used:
an input method's composition, a drop and a paste were dispatched as synthetic events (the drop and the
paste carrying a real `DataTransfer` built in the page); Attach went through each engine's file chooser
as Playwright drives it. A pass is package evidence only, not a product's adoption.

## Family reference synchronization

**Synchronization blocked** in this assignment: the family reference (Beyond Suite's `branding/`) is
outside the worktree this release was built in, and the suite's principal checkout was not to be
touched. Affected: the component catalog (`Facts`, `Meter`, `ChoiceChip`, the composer's settings,
state line, attachments and suggestions, the panel's head and widths, the compact header, the
sidebar's ages and counts) and token set 0.4.0's pending proposals of D67. Owner: the round's
coordinator. Remaining: re-vendor 0.11.0 in the reference, register D67's tokens as a proposal (never
as approved) and model the conversation's round two once Conduict adopts it.
