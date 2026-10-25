# UI 0.34.0, phase 1: the pendings the round `settled` left in the package

Evidence baseline: UI `7568947` (0.32.1) on `feature/next` plus this branch (`claude/settled-close-20261025`), made in a worktree on 2026-10-25 for the suite's round `landed`. Token set 0.7.0 is unchanged. The branch is not yet rebased onto 0.33.0, which another session releases at the same time; this record is the phase-1 candidate's, and the release record follows the rebase. Implementation is not the owner's acceptance.

## What changed, by pending

### A chooser that waits, and a held Send's place (`ui-choice-waiting`, finding SET-F03)

- `ChoiceMenu` and `ChoiceChip` take `waiting` (option and setter) and `place`, as `Button` does (D183). While a choice waits for an earlier one, its button is quiet (`aria-disabled`, the family's quiet look, no hover lift in a composer) and reachable by Tab. A press (a click, Enter or Space, ArrowDown or ArrowUp) opens nothing and only focuses `place()`, saying nothing; without `place` a press does nothing. `open()` returns false while it waits, and becoming waiting closes an open list without moving focus. Native `disabled` stays for a choice that can never be made, and a stated single option is unaffected. `ChoicePress` (`src/dom/choice/press.js`) owns the button's press; `ChoiceFinder` took its search field's keys, which kept `ChoiceMenu` within 300 lines.
- A composer's `disabled` may carry `place`: a press on the held Send goes there, sending nothing and saying nothing more than its reason. Enter in the field never sends and keeps focus there (`ComposerMarks.held`).
- React `ChoiceMenu`, `ChoiceChip` and `Composer` read `place` from the latest props.

### React's `Form` and the browser's own message for a wrong value (`ui-form-constraint-messages`)

- The decision: React `Form` takes `report`, off by default. With it, once the first part that needs something is a control failing its own constraints (a type, a pattern, a range, a custom validity), the browser says that control's message and takes the focus, and `onSubmit` does not run. A part that waits before it still takes the caret silently. Both forms read one rule, `Required.report(event)`, which `FocusedForm` without fields used inline before. The default stays off so a product that says wrong values in its own words (Accounts) never hears the browser's bubble as well. CDN's administration can drop its seven `form.reportValidity()` lines for `report`.
- The order follows `FocusedForm`'s: a wrong value that comes before a waiting part is said first. The brief's "once nothing waits" describes the usual case; the one rule keeps the two forms alike.

### Focus a product moves while the opening covers it (`ui-opening-hidden-focus`)

- The mechanism: for the cover's lifetime only, `OpeningFocus` (`src/opening/focus.js`) wraps `HTMLElement.prototype.focus` and `SVGElement.prototype.focus`. Every call still reaches the platform, and the last target outside the opening (never the document itself, never a call on something that is not an element) is kept with its options. At the hand-over the originals are restored (a wrapper another script placed over them is left, inert), and `OpeningExit` gives the focus to the last target still in the page that takes it, with its options, unless the person's focus is in the product already. A person in the leaving recovery gets it over the generic destination. A focus asked for after the hand-over is the platform's alone. Only the first load's opening is concerned.
- Rejected: showing the product with `opacity` instead of `visibility`, which would let Tab, the pointer and screen readers reach an invisible product while it is covered.
- `OpeningRecovery.outdated()` now says a document another version drew, which kept the runtime within 300 lines.

### The package's boxes no fixture drew (`family-d184-product-boxes`, the package's part)

- The insets pages draw an editable `CommandCard` (its textarea) and an outage's line in a narrow block, its words wrapping beside Try again, and the inset check measures every box again at compact density and with a coarse pointer (touch emulated), in the plain DOM consumer. Results and corrections: below.

### The compact search's one accessible name (`family-journeys-compact-search-labels`)

- The decision, recorded in the catalog, the list tools' guide and the architecture: a list's compact search keeps one accessible name for its button and its field, since the button is a disclosure that opens the field it names. A test opens it with `getByRole('button', { name })`, then reaches the field with `getByRole('searchbox', { name })`. No code changed; the source showed no defect.

### A tray chip for what goes with a message (for `conduict-composer-waiting-comments`)

- `ComposerChip` (DOM and React) is a chip that acts: a button in the chips' geometry (D165, one target tall, the quiet edge, round) with a muted `label`, a `value`, an optional `glyph`, `name` for its accessible name and `onclick`. It draws no chevron. Its whole face is its family tooltip only while a shortened toolbar sets its label aside; its value is never cut, since an action is named whole (D179). `label`, `value` and `name` are setters that keep its focus. It carries no copy of its own.

## Executed checks

To be completed from the runs.

## Not established

To be completed.
