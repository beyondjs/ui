# UI 0.35.0, phase 1: the pendings the round `settled` left in the package

Evidence baseline: this branch (`claude/settled-close-20261025`), made in a worktree on 2026-10-25 for the suite's round `landed` on UI `7568947` (0.32.1) and rebased onto 0.33.0 (`ac91ee2`) on `feature/next`, keeping both sides. Token set 0.7.0 is unchanged. The round's release is 0.35.0: another session releases 0.34.0 first, and the branch is rebased onto it before the release, whose record follows. The release record lists the released commits. Implementation is not the owner's acceptance.

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
  - Recovery's wide form held its wrapping title's capitals 22.1 px from its border against 16 px: its words now take off their half-leading on both sides above 480 px, which keeps one line centred on Try again. This is Recovery's inset rule alone, committed separately ("Keep one inset in Recovery's wide form…") with the coordinator's agreement, since Recovery is 0.33.0's.
- The first run's compact density was never applied (an init script runs before the root exists); the check now sets it as soon as the root exists.
- Found in Chrome 155's fourth run, with a coarse pointer:
  - an action menu's entries held their words at the top of their 44 px targets, ending the menu 26.3 px under its last baseline against 16 px above its first capitals. Each entry now centres its words, and the target's height decides the menu's inset (about 21 px with the menu's 4 px), which its sides keep; the check holds those sides to the menu's top there (`touch: { inset: 'even' }`);
  - a notification row's last line of 44 px targets ("2 updates", "Mark as read") grows the row, so its words end about 21 px from its bottom against 8 px above. Hanging the targets past its edge would cover the next row's, so it waits for a design decision (`family-touch-notification-rows`), measured for the record; the notification panel's taller rows scroll it by design.
- Found against 0.33.0 after the rebase: offline, `Recovery`'s line has no Try again, so beside nothing the 18 px mark set the line and held the words' capitals about 3.5 px past the inset in the wide form. The mark now takes off what it adds past the words' capitals there, and the check measures the line offline (`context.setOffline`). Under 480 px, the hidden Try again's empty row keeps its gap, so the words stand 16 px above their details against 8 px; that is Recovery's layout, not an inset, and is left to its owner.

### The compact search's one accessible name (`family-journeys-compact-search-labels`)

- The decision, recorded in the catalog, the list tools' guide and the architecture: a list's compact search keeps one accessible name for its button and its field, since the button is a disclosure that opens the field it names. A test opens it with `getByRole('button', { name })`, then reaches the field with `getByRole('searchbox', { name })`. No code changed; the source showed no defect.

### A command's CopyMessage drew its whole holder in the code's face (item 7, found by Beyond Home)

- `CopyMessage` gives its holder its kind's class, so a command's holder (`div.bui-copy.bui-copy-command`) also matched the code box's rules (`pre.bui-copy-text.bui-copy-command`): `rows.css`'s monospace face, `white-space: pre` and scrolling took the holder, its Copy command and its result line, its 54ch measure was counted in monospace (about 20 px short of a 448 px column), and `insets.css`'s `text-box` trim matched it. Both rules now name the code box by its two classes; the classes are unchanged, so a product's selector keeps working. Beyond Home's own check selects `.bui-copy-command` and reads its first match, the holder, as monospace: it needs the code box's selector.

### A tray chip for what goes with a message (for `conduict-composer-waiting-comments`)

- `ComposerChip` (DOM and React) is a chip that acts: a button in the chips' geometry (D165, one target tall, the quiet edge, round) with a muted `label`, a `value`, an optional `glyph`, `name` for its accessible name and `onclick`. It draws no chevron. Its whole face is its family tooltip only while a shortened toolbar sets its label aside; its value is never cut, since an action is named whole (D179). `label`, `value` and `name` are setters that keep its focus. It carries no copy of its own.
- Found while building it: the composer's tray hid a `ChoiceChip`'s label (its value alone, D165) but had no tooltip, so the label was said only to assistive technology. The toolbar's tooltip now covers the box, the tray's chips with the settings', and the box carries it into the taller editor.

### A button's own wait in a form (item 10, found by the Packages interface)

- The case: `Required` quieted Save and kept it among the buttons it quieted; the product then set the package `Button`'s `waiting` for its own condition; once the form held everything, `Required` freed it, and the product's wait was lost. The Packages interface worked around it with a React `key` per state.
- A package `Button` now marks its own wait with `data-bui-waiting`, in the DOM and in React. `Required` and `Quiet` never free a control that carries it or `data-busy` (`Required.held(control)`), and read it again when either ends: `Required` through its observer of the form's structure, `Quiet` through one of its control's two attributes. A part that still waits then quiets it again.

### A React `DataTable` cell that renders nothing (item 11, found by the Packages interface)

- A React cell's holder is filled after the table draws it, so the table never took it for empty: in the narrow layout its label and separator stayed, and a line whose first secondary cell rendered nothing began with "· ".
- React's `DataTable` marks a cell `data-empty` when what it rendered holds no text and no element, and reads it again whenever that content changes (one observer of its holders), so the narrow line leaves out its label and separator. The DOM table already read its own values so; `DataTable`'s 0.33.0 outage place is unchanged.

### The mark of an arrival (item 9, asked by the coordinator for the products' tests)

- The document element carries `data-bui-opened` once the opening no longer covers the product: after the hand-over, once the identity has landed on the bar (the bar's `data-bui-landing` gone), and when the opening steps aside for a development server's error overlay; at once without the opening's markup, before the product's modules run. While its recovery shows it never sets it, nothing removes it, and a document that never loads the controller never carries it. Inside the package, `OpeningExit.opened()` sets it and the exit's `landed` resolves once the landing mark has gone; neither is exported.
- Corrected after an independent review: the hand-over is guarded, so a focus that throws (a product's custom element) never keeps the veil over the product, and `landed` is one promise from the exit's construction, so it waits for the hand-over whenever it is read.
- An attribute, not an event: a test reads it at any time, with a selector or a wait, where an event is lost to a listener added after it. Products' tests wait for `html[data-bui-opened]` instead of the opening's own parts.

## What the independent review of the first candidate found, and its corrections

The coordinator had the first candidate ("Let a ref chooser wait for its repository…") reviewed independently; each finding below is corrected, with the coordinator's decision where one was needed.

- **The sidebar's search wrote under its glyph** (a regression of "Keep one inset in an editable command's field and in single-line controls…"): the late `input.bui-input { padding-inline }` rule (0,1,1) beat `.bui-sidebar-query`'s (0,1,0). The fields' and selects' base rules in `forms.css` now read `--bui-line-inset` themselves, early in the cascade, and the late rules are gone, so every field's own padding keeps its place; the inset check asserts that the sidebar's search starts its words after its glyph. Every padding rule that reaches a `.bui-input` was checked again: the picker's and the choice menu's search fields (0,2,0) and the palette's field were never affected.
- **A waiting `RefChooser` with no refs said "No branches to choose from."**, "Loading branches…" or "Couldn't read the branches." with an able Try again. While it waits it now draws its quiet menu with its placeholder whatever its refs, `loading` or `unavailable` say, so its visible escape is never drawn while it waits and needs no wait of its own (that code, and the quiet link button's rule added with it, are gone).
- **`ComposerChip`'s `name` failed WCAG 2.5.3, Label in Name.** Decision: its face is always its accessible name; `description` replaces `name`, read through `aria-describedby` from a visually hidden element beside the button. `element` is now a holder (`display: contents`) with the button and its description; `control` is the button.
- **`land()` could focus several targets in a row**, overriding a target that hands its focus on: it now stops at the first call that moved the focus, or that left it inside the target.
- **The split menu's other ways to send ignored `place` and repeated the reason under each item.** While Send is held they are quiet (an `ActionMenu` item's new `waiting`): with `place`, a press closes the menu and goes there; the reason is said once, beside Send (D101).
- **Focus dropped to the body** when a choice started waiting while its list or the escape field held it: it goes back to the quiet button; once a ref chooser's wait ends into a state without its menu, the button's focus goes to that state's first control.
- **Cleanups:** `RefChooser.other()` opens nothing while it waits; the opening creates its focus recorder last in `#start()`, so a throw earlier never leaves `focus()` wrapped; the waiting chip's unit test presses Enter and Space as the platform's activation.

## What the independent review of the later commits found, and its corrections

The coordinator had the commits after the first review (the mark of an arrival, the touch menu, the offline Recovery line, a button's own wait, the narrow table's empty cell and the renumbering) reviewed independently; each finding is corrected:

- **A named submit button outside the form was not heard** (a dialog's footer): its own wait ending while a part waited left it able until the next input. `Required` now observes each such button's `data-busy` and `data-bui-waiting` too, in the DOM and in React.
- **A choice's menu kept the touch defect the action menu's fix had closed**: the rule named `ul.bui-menu`, while a choice's list is a panel around its own list. It now names every menu's entries; the insets page draws a choice of one-line entries (a composer's Effort), measured on a touch screen with the choice menus held even.
- **What `data-bui-opened` says was too broad**: it says the opening no longer covers the product; without the opening's markup it is set before the product runs, so a test waits for the product's own content there; a document that never loads the controller never carries it; under a paused clock the hand-over's 700 ms and the landing's 400 ms are timers to advance. `OpeningExit.mark` is not exported, so no guide names it as public.
- **A focus that throws could keep the veil over the product**: the hand-over is guarded (the opening leaves, the fonts are given back and the mark is set whatever it meets), and each focus the opening lands is caught. `landed` is one promise from the exit's construction, so it waits for the hand-over whenever it is read.
- **The mark's other paths are checked in a real engine**: absent while the late, failed and offline recoveries show and with JavaScript off; set after a late recovery's hand-over and the overlay's step aside.
- **The tables read emptiness two ways**: React took spaces for content, and the DOM took a childless field for empty. One rule (`CellContent`) now reads both, and React reads again only the cells whose content changed.
- **The same class as a button's own wait**: React's busy link now says `data-busy`, as the DOM's does, and a choice's own wait is marked `data-bui-waiting`, so neither a form nor a `Quiet` frees them.

## Executed checks

To be completed from the runs.

## Not established

To be completed.
