# UI 0.34.0, phase 1: the pendings the round `settled` left in the package

Evidence baseline: UI `7568947` (0.32.1) on `feature/next` plus this branch (`claude/settled-close-20261025`), made in a worktree on 2026-10-25 for the suite's round `landed`. Token set 0.7.0 is unchanged. The branch is not yet rebased onto 0.33.0, which another session releases at the same time; this record is the phase-1 candidate's, and the release record follows the rebase. Implementation is not the owner's acceptance.

## What changed, by pending

### A chooser that waits, and a held Send's place (`ui-choice-waiting`, finding SET-F03)

- `ChoiceMenu` and `ChoiceChip` take `waiting` (option and setter) and `place`, as `Button` does (D183). While a choice waits for an earlier one, its button is quiet (`aria-disabled`, the family's quiet look, no hover lift in a composer) and reachable by Tab. A press (a click, Enter or Space, ArrowDown or ArrowUp) opens nothing and only focuses `place()`, saying nothing; without `place` a press does nothing. `open()` returns false while it waits, and becoming waiting closes an open list without moving focus. Native `disabled` stays for a choice that can never be made, and a stated single option is unaffected. `ChoicePress` (`src/dom/choice/press.js`) owns the button's press; `ChoiceFinder` took its search field's keys, which kept `ChoiceMenu` within 300 lines.
- A composer's `disabled` may carry `place`: a press on the held Send goes there, sending nothing and saying nothing more than its reason. Enter in the field never sends and keeps focus there (`ComposerMarks.held`).
- React `ChoiceMenu`, `ChoiceChip` and `Composer` read `place` from the latest props.
- `RefChooser` waits too (item 8, asked by Conduict's agent, whose start branch chip is a `RefChooser`): `waiting` and `place` pass to its menu, its visible escape is quiet with it (a quiet link button: muted, no underline) and its press goes to `place()`, and an escape field already open closes. React `RefChooser` takes the same props.

### React's `Form` and the browser's own message for a wrong value (`ui-form-constraint-messages`)

- The decision: React `Form` takes `report`, off by default. With it, once the first part that needs something is a control failing its own constraints (a type, a pattern, a range, a custom validity), the browser says that control's message and takes the focus, and `onSubmit` does not run. A part that waits before it still takes the caret silently. Both forms read one rule, `Required.report(event)`, which `FocusedForm` without fields used inline before. The default stays off so a product that says wrong values in its own words (Accounts) never hears the browser's bubble as well. CDN's administration can drop its seven `form.reportValidity()` lines for `report`.
- The order follows `FocusedForm`'s: a wrong value that comes before a waiting part is said first. The brief's "once nothing waits" describes the usual case; the one rule keeps the two forms alike.

### Focus a product moves while the opening covers it (`ui-opening-hidden-focus`)

- The mechanism: for the cover's lifetime only, `OpeningFocus` (`src/opening/focus.js`) wraps `HTMLElement.prototype.focus` and `SVGElement.prototype.focus`. Every call still reaches the platform, and the last target outside the opening (never the document itself, never a call on something that is not an element) is kept with its options. At the hand-over the originals are restored (a wrapper another script placed over them is left, inert), and `OpeningExit` gives the focus to the last target still in the page that takes it, with its options, unless the person's focus is in the product already. A person in the leaving recovery gets it over the generic destination. A focus asked for after the hand-over is the platform's alone. Only the first load's opening is concerned.
- Rejected: showing the product with `opacity` instead of `visibility`, which would let Tab, the pointer and screen readers reach an invisible product while it is covered.
- `OpeningRecovery.outdated()` now says a document another version drew, which kept the runtime within 300 lines.

### The package's boxes no fixture drew (`family-d184-product-boxes`, the package's part)

- The insets pages draw an editable `CommandCard` (its textarea), an outage's line in a narrow block whose words wrap beside Try again, and a command's `CopyMessage`; the inset check measures every box again at compact density and with a coarse pointer (touch emulated), in the plain DOM consumer, and says every side that broke in one failure.
- Found in Chrome 155 and corrected:
  - the editable command's field held its capitals 10.5 px from its top against 12 px (a textarea trims nothing): it now takes off its own half-leading;
  - a touch screen's 44 px field held its words 15.6 px from its top and bottom against 12 px at its sides, and compact density's 30 px about 9 px: a single-line control's sides (a text field, a select, a choice's button) and its chevron now take the room its height leaves above its capitals there (`--bui-line-inset`), the comfortable 36 px control keeping its 12 px. The check holds such a control's sides to its own top (`even`);
  - Recovery's wide form held its wrapping title's capitals 22.1 px from its border against 16 px: its words now take off their half-leading on both sides above 480 px, which keeps one line centred on Try again. This is Recovery's inset rule alone, committed separately (`17df828`) with the coordinator's agreement, since Recovery is 0.33.0's.
- The first run's compact density was never applied (an init script runs before the root exists); the check now sets it as soon as the root exists.

### The compact search's one accessible name (`family-journeys-compact-search-labels`)

- The decision, recorded in the catalog, the list tools' guide and the architecture: a list's compact search keeps one accessible name for its button and its field, since the button is a disclosure that opens the field it names. A test opens it with `getByRole('button', { name })`, then reaches the field with `getByRole('searchbox', { name })`. No code changed; the source showed no defect.

### A command's CopyMessage drew its whole holder in the code's face (item 7, found by Beyond Home)

- `CopyMessage` gives its holder its kind's class, so a command's holder (`div.bui-copy.bui-copy-command`) also matched the code box's rules (`pre.bui-copy-text.bui-copy-command`): `rows.css`'s monospace face, `white-space: pre` and scrolling took the holder, its Copy command and its result line, its 54ch measure was counted in monospace (about 20 px short of a 448 px column), and `insets.css`'s `text-box` trim matched it. Both rules now name the code box by its two classes; the classes are unchanged, so a product's selector keeps working. Beyond Home's own check selects `.bui-copy-command` and reads its first match, the holder, as monospace: it needs the code box's selector.

### A tray chip for what goes with a message (for `conduict-composer-waiting-comments`)

- `ComposerChip` (DOM and React) is a chip that acts: a button in the chips' geometry (D165, one target tall, the quiet edge, round) with a muted `label`, a `value`, an optional `glyph`, `name` for its accessible name and `onclick`. It draws no chevron. Its whole face is its family tooltip only while a shortened toolbar sets its label aside; its value is never cut, since an action is named whole (D179). `label`, `value` and `name` are setters that keep its focus. It carries no copy of its own.
- Found while building it: the composer's tray hid a `ChoiceChip`'s label (its value alone, D165) but had no tooltip, so the label was said only to assistive technology. The toolbar's tooltip now covers the box, the tray's chips with the settings', and the box carries it into the taller editor.

## What the independent review of `fef34b2` found, and its corrections

The coordinator had `fef34b2` (the first candidate) reviewed independently; each finding below is corrected, with the coordinator's decision where one was needed.

- **The sidebar's search wrote under its glyph** (a regression of `807c64d`): the late `input.bui-input { padding-inline }` rule (0,1,1) beat `.bui-sidebar-query`'s (0,1,0). The fields' and selects' base rules in `forms.css` now read `--bui-line-inset` themselves, early in the cascade, and the late rules are gone, so every field's own padding keeps its place; the inset check asserts that the sidebar's search starts its words after its glyph. Every padding rule that reaches a `.bui-input` was checked again: the picker's and the choice menu's search fields (0,2,0) and the palette's field were never affected.
- **A waiting `RefChooser` with no refs said "No branches to choose from."**, "Loading branches…" or "Couldn't read the branches." with an able Try again. While it waits it now draws its quiet menu with its placeholder whatever its refs, `loading` or `unavailable` say, so its visible escape is never drawn while it waits and needs no wait of its own (that code, and the quiet link button's rule added with it, are gone).
- **`ComposerChip`'s `name` failed WCAG 2.5.3, Label in Name.** Decision: its face is always its accessible name; `description` replaces `name`, read through `aria-describedby` from a visually hidden element beside the button. `element` is now a holder (`display: contents`) with the button and its description; `control` is the button.
- **`land()` could focus several targets in a row**, overriding a target that hands its focus on: it now stops at the first call that moved the focus, or that left it inside the target.
- **The split menu's other ways to send ignored `place` and repeated the reason under each item.** While Send is held they are quiet (an `ActionMenu` item's new `waiting`): with `place`, a press closes the menu and goes there; the reason is said once, beside Send (D101).
- **Focus dropped to the body** when a choice started waiting while its list or the escape field held it: it goes back to the quiet button; once a ref chooser's wait ends into a state without its menu, the button's focus goes to that state's first control.
- **Cleanups:** `RefChooser.other()` opens nothing while it waits; the opening creates its focus recorder last in `#start()`, so a throw earlier never leaves `focus()` wrapped; the waiting chip's unit test presses Enter and Space as the platform's activation.

## Executed checks

To be completed from the runs.

## Not established

To be completed.
